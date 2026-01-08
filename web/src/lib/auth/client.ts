import type { AuthConfig, AuthTokens } from "./types";

export type DiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint?: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
  code_challenge_methods_supported?: string[];
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
};

const discoveryCache = new Map<string, DiscoveryDocument>();

const normalizeIssuer = (issuer: string) => issuer.replace(/\/+$/g, "");

const asFormBody = (body: Record<string, string>) => {
  const params = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    params.set(key, value);
  });
  return params;
};

const parseTokens = (data: TokenResponse): AuthTokens => {
  const expiresAt =
    typeof data.expires_in === "number"
      ? Date.now() + data.expires_in * 1000
      : undefined;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    tokenType: data.token_type,
    scope: data.scope,
    expiresAt
  };
};

export async function fetchDiscovery(issuer: string): Promise<DiscoveryDocument> {
  const normalizedIssuer = normalizeIssuer(issuer);
  const cached = discoveryCache.get(normalizedIssuer);
  if (cached) {
    return cached;
  }

  const response = await fetch(
    `${normalizedIssuer}/.well-known/openid-configuration`
  );

  if (!response.ok) {
    throw new Error("Failed to load OIDC discovery document");
  }

  const discovery = (await response.json()) as DiscoveryDocument;
  discoveryCache.set(normalizedIssuer, discovery);
  return discovery;
}

export async function exchangeCodeForTokens(
  config: AuthConfig,
  code: string,
  codeVerifier: string
): Promise<AuthTokens> {
  const discovery = await fetchDiscovery(config.issuer);
  const body = asFormBody({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier
  });

  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error("Failed to exchange authorization code");
  }

  const data = (await response.json()) as TokenResponse;
  return parseTokens(data);
}

export async function refreshAccessToken(
  config: AuthConfig,
  refreshToken: string
): Promise<AuthTokens> {
  const discovery = await fetchDiscovery(config.issuer);
  const body = asFormBody({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId
  });

  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = (await response.json()) as TokenResponse;
  return parseTokens({ ...data, refresh_token: data.refresh_token ?? refreshToken });
}

export async function revokeToken(
  config: AuthConfig,
  token: string,
  hint: "access_token" | "refresh_token" = "refresh_token"
) {
  const discovery = await fetchDiscovery(config.issuer);
  if (!discovery.revocation_endpoint) {
    return;
  }

  const body = asFormBody({
    token,
    token_type_hint: hint,
    client_id: config.clientId
  });

  await fetch(discovery.revocation_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}
