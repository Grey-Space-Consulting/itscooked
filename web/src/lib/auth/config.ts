import type { AuthConfig } from "./types";

const defaultRedirectUri = () => {
  if (typeof window === "undefined") {
    return "/auth/callback";
  }

  return `${window.location.origin}/auth/callback`;
};

export function getAuthConfig(): AuthConfig | null {
  const issuer = import.meta.env.VITE_OIDC_ISSUER;
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID;

  if (!issuer || !clientId) {
    return null;
  }

  const redirectUri =
    import.meta.env.VITE_OIDC_REDIRECT_URI ?? defaultRedirectUri();
  const scope = import.meta.env.VITE_OIDC_SCOPE ?? "openid profile email";
  const audience = import.meta.env.VITE_OIDC_AUDIENCE;

  return {
    issuer,
    clientId,
    redirectUri,
    scope,
    audience: audience || undefined
  };
}
