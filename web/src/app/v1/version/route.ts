import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_REF ??
    "dev";

  return NextResponse.json(
    {
      version,
      runtime: "nodejs"
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
