import type { ApiConfig, ApiErrorPayload } from "./types";

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const defaultConfig: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  config: ApiConfig = defaultConfig,
  accessToken?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    headers,
    ...options
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    throw new ApiError(
      payload?.message ?? "Request failed",
      response.status,
      payload
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type ApiClient = {
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  get: <T>(path: string, options?: RequestInit) => Promise<T>;
  post: <T>(path: string, body?: unknown, options?: RequestInit) => Promise<T>;
};

type ApiClientOptions = {
  config?: ApiConfig;
  getAccessToken?: () => Promise<string | null> | string | null;
  onUnauthorized?: () => void;
};

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const config = options.config ?? defaultConfig;

  const request = async <T>(path: string, init: RequestInit = {}) => {
    const accessToken = options.getAccessToken
      ? await options.getAccessToken()
      : null;

    try {
      return await apiRequest<T>(path, init, config, accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        options.onUnauthorized?.();
      }
      throw error;
    }
  };

  return {
    request,
    get: (path, init) => request(path, { ...init, method: "GET" }),
    post: (path, body, init) =>
      request(path, {
        ...init,
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body)
      })
  };
}
