import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseRecipeCreateBody } from "@/lib/recipes";
import { importRecipeFromUrl } from "@/lib/importer";

export async function GET() {
  const { userId } = await auth();

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
      originalCreator: true,
      thumbnailUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ recipes });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

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
    const importResult = await importRecipeFromUrl({
      url: parsed.data.url,
      platform: parsed.data.sourcePlatform,
      fallbackTitle: parsed.data.title,
    });

    const hasExtraction =
      importResult.ingredientsList.length > 0 ||
      importResult.instructionsList.length > 0;
    const extractionStatus = hasExtraction
      ? importResult.warnings.length > 0
        ? "partial"
        : "success"
      : "failed";

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        sourceUrl: parsed.data.url,
        sourcePlatform: parsed.data.sourcePlatform,
        title: importResult.title ?? null,
        ingredientsList: importResult.ingredientsList.length
          ? importResult.ingredientsList
          : null,
        instructionsList: importResult.instructionsList.length
          ? importResult.instructionsList
          : null,
        originalCreator: importResult.originalCreator ?? null,
        thumbnailUrl: importResult.thumbnailUrl ?? null,
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
      },
    });

    return NextResponse.json(
      {
        recipe,
        extraction: {
          status: extractionStatus,
          warnings: importResult.warnings,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingRecipe = await prisma.recipe.findFirst({
        where: { userId, sourceUrl: parsed.data.url },
        select: {
          id: true,
          title: true,
          sourceUrl: true,
          sourcePlatform: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        { error: "That recipe link is already saved.", existingRecipe },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to save the recipe right now." },
      { status: 500 },
    );
  }
}
