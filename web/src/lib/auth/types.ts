export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "disabled"
  | "error";

export type AuthConfig = {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  audience?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: number;
};

export type AuthTransaction = {
  state: string;
  codeVerifier: string;
  createdAt: number;
  redirectUri: string;
  postLoginRedirect?: string;
};
