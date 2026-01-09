import { createClerkClient, verifyToken } from "@clerk/nextjs/server";
import { serverError, unauthorized } from "./apiErrors";

type AuthResult = {
  userId: string;
  sessionId?: string;
};

const getTokenFromHeader = (request: Request) => {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return header.slice(7).trim();
};

export async function requireAuth(request: Request): Promise<AuthResult> {
  const token = getTokenFromHeader(request);
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!token) {
    throw unauthorized("Missing authorization token.");
  }
  if (!secretKey) {
    throw serverError("Missing Clerk secret key.");
  }

  const { data, errors } = await verifyToken(token, { secretKey });
  const hasErrors = Array.isArray(errors) && errors.length > 0;
  if (!data || hasErrors) {
    throw unauthorized("Invalid session token.");
  }

  const payload = data as { sub?: string; sid?: string };
  if (!payload.sub) {
    throw unauthorized("Invalid session token.");
  }

  return {
    userId: payload.sub,
    sessionId: payload.sid
  };
}

export async function fetchClerkUser(userId: string) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw serverError("Missing Clerk secret key.");
  }
  const clerk = createClerkClient({ secretKey });
  return clerk.users.getUser(userId);
}
