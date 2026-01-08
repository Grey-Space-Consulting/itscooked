import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";
import { fetchDiscovery, exchangeCodeForTokens, refreshAccessToken, revokeToken } from "./client";
import { getAuthConfig } from "./config";
import { createChallenge, generateVerifier } from "./pkce";
import { loadTokens, loadTransaction, saveTokens, saveTransaction } from "./storage";
import type { AuthConfig, AuthStatus, AuthTokens, AuthTransaction } from "./types";

const tokenRefreshBufferMs = 60_000;

type AuthContextValue = {
  status: AuthStatus;
  tokens: AuthTokens | null;
  error: string | null;
  config: AuthConfig | null;
  isAuthenticated: boolean;
  postLoginRedirect: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  handleUnauthorized: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getPostLoginRedirect = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
};

const clearAuthParams = () => {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
};

const isTokenStale = (tokens: AuthTokens | null) => {
  if (!tokens?.expiresAt) {
    return false;
  }

  return tokens.expiresAt - Date.now() <= tokenRefreshBufferMs;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => getAuthConfig(), []);
  const [status, setStatus] = useState<AuthStatus>(
    config ? "loading" : "disabled"
  );
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(
    null
  );
  const refreshPromiseRef = useRef<Promise<AuthTokens | null> | null>(null);

  const clearSession = useCallback(() => {
    setTokens(null);
    saveTokens(null);
    setStatus(config ? "unauthenticated" : "disabled");
  }, [config]);

  const handleUnauthorized = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshSession = useCallback(async (): Promise<AuthTokens | null> => {
    const refreshToken = tokens?.refreshToken;
    if (!config || !refreshToken) {
      return null;
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshTask = (async () => {
      try {
        const nextTokens = await refreshAccessToken(config, refreshToken);
        setTokens(nextTokens);
        saveTokens(nextTokens);
        setStatus("authenticated");
        return nextTokens;
      } catch {
        clearSession();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshTask;
    return refreshTask;
  }, [config, tokens, clearSession]);

  const getAccessToken = useCallback(async () => {
    if (!tokens) {
      return null;
    }

    if (isTokenStale(tokens)) {
      const refreshed = await refreshSession();
      return refreshed?.accessToken ?? null;
    }

    return tokens.accessToken;
  }, [tokens, refreshSession]);

  const login = useCallback(async () => {
    if (!config) {
      setError("Auth is not configured yet.");
      setStatus("disabled");
      return;
    }

    try {
      setError(null);
      setStatus("loading");

      const state = generateVerifier(32);
      const codeVerifier = generateVerifier();
      const codeChallenge = await createChallenge(codeVerifier);
      const transaction: AuthTransaction = {
        state,
        codeVerifier,
        createdAt: Date.now(),
        redirectUri: config.redirectUri,
        postLoginRedirect: getPostLoginRedirect()
      };

      saveTransaction(transaction);
      setPostLoginRedirect(transaction.postLoginRedirect ?? null);

      const discovery = await fetchDiscovery(config.issuer);
      const params = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scope,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state
      });

      if (config.audience) {
        params.set("audience", config.audience);
      }

      window.location.assign(`${discovery.authorization_endpoint}?${params}`);
    } catch {
      setError("Unable to start sign-in.");
      setStatus("error");
    }
  }, [config]);

  const logout = useCallback(async () => {
    if (!config || !tokens) {
      clearSession();
      return;
    }

    try {
      if (tokens.refreshToken) {
        await revokeToken(config, tokens.refreshToken, "refresh_token");
      }
    } finally {
      clearSession();
    }
  }, [config, tokens, clearSession]);

  const handleAuthRedirect = useCallback(async () => {
    if (!config || typeof window === "undefined") {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const authError = params.get("error");
    if (authError) {
      setError(params.get("error_description") ?? "Sign-in failed.");
      setStatus("error");
      clearAuthParams();
      return true;
    }

    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      return false;
    }

    const transaction = loadTransaction();
    saveTransaction(null);

    if (!transaction || transaction.state !== state) {
      setError("Sign-in state mismatch.");
      setStatus("error");
      clearAuthParams();
      return true;
    }

    try {
      const nextTokens = await exchangeCodeForTokens(
        config,
        code,
        transaction.codeVerifier
      );
      setTokens(nextTokens);
      saveTokens(nextTokens);
      setStatus("authenticated");
      setPostLoginRedirect(transaction.postLoginRedirect ?? null);
      clearAuthParams();
      return true;
    } catch {
      setError("Unable to complete sign-in.");
      setStatus("error");
      clearAuthParams();
      return true;
    }
  }, [config]);

  useEffect(() => {
    if (!config) {
      return;
    }

    let isActive = true;

    const initialize = async () => {
      const handledRedirect = await handleAuthRedirect();
      if (!isActive || handledRedirect) {
        return;
      }

      const storedTokens = loadTokens();
      if (storedTokens) {
        setTokens(storedTokens);

        if (isTokenStale(storedTokens)) {
          if (!storedTokens.refreshToken) {
            setStatus("authenticated");
            return;
          }

          try {
            const nextTokens = await refreshAccessToken(
              config,
              storedTokens.refreshToken
            );
            if (!isActive) {
              return;
            }
            setTokens(nextTokens);
            saveTokens(nextTokens);
            setStatus("authenticated");
          } catch {
            if (isActive) {
              clearSession();
            }
          }
          return;
        }

        setStatus("authenticated");
        return;
      }

      setStatus("unauthenticated");
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, [config, handleAuthRedirect, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      tokens,
      error,
      config,
      isAuthenticated: status === "authenticated",
      postLoginRedirect,
      login,
      logout,
      getAccessToken,
      handleUnauthorized
    }),
    [
      status,
      tokens,
      error,
      config,
      postLoginRedirect,
      login,
      logout,
      getAccessToken,
      handleUnauthorized
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
