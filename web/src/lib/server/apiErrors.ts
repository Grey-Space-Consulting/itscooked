import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "bad_request"
  | "server_error";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const apiError = (
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) => new ApiError(status, code, message, details);

export const unauthorized = (message = "Unauthorized.") =>
  apiError(401, "unauthorized", message);

export const forbidden = (message = "Forbidden.") =>
  apiError(403, "forbidden", message);

export const notFound = (message = "Not found.") =>
  apiError(404, "not_found", message);

export const validationError = (message: string, details?: unknown) =>
  apiError(400, "validation_error", message, details);

export const badRequest = (message: string, details?: unknown) =>
  apiError(400, "bad_request", message, details);

export const serverError = (message: string, details?: unknown) =>
  apiError(500, "server_error", message, details);

export const respondWithError = (error: unknown) => {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        message: error.message,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.status }
    );
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error.";

  return NextResponse.json(
    {
      message,
      error: {
        code: "server_error",
        message,
        details: error instanceof Error ? undefined : error
      }
    },
    { status: 500 }
  );
};
