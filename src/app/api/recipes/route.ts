import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ recipes: [] });
}
