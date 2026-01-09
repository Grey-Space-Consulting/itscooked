import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseRecipeUpdateBody } from "@/lib/recipes";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { userId } = auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      sourcePlatform: true,
      ingredientsList: true,
      instructionsList: true,
      originalCreator: true,
      thumbnailUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ recipe });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { userId } = auth();
  const { id } = await params;

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

  const parsed = parseRecipeUpdateBody(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id, userId },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.recipe.update({
    where: { id },
    data: {
      title: parsed.data.title,
      ingredientsList:
        parsed.data.ingredientsList === undefined
          ? undefined
          : parsed.data.ingredientsList.length
            ? parsed.data.ingredientsList
            : null,
      instructionsList:
        parsed.data.instructionsList === undefined
          ? undefined
          : parsed.data.instructionsList.length
            ? parsed.data.instructionsList
            : null,
    },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      sourcePlatform: true,
      ingredientsList: true,
      instructionsList: true,
      originalCreator: true,
      thumbnailUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ recipe: updated });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { userId } = auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.recipe.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
