import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseRecipeCreateBody } from "@/lib/recipes";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      sourcePlatform: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ recipes });
}

export async function POST(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = parseRecipeCreateBody(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        sourceUrl: parsed.data.url,
        sourcePlatform: parsed.data.sourcePlatform,
        title: parsed.data.title ?? null,
      },
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        sourcePlatform: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That recipe link is already saved." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to save the recipe right now." },
      { status: 500 },
    );
  }
}
