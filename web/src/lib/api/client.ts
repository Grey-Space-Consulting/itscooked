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
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? ""
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  config: ApiConfig = defaultConfig
): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
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
