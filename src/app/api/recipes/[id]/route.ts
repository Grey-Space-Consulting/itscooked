import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      sourcePlatform: true,
      ingredientsList: true,
      instructionsList: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ recipe });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.recipe.deleteMany({
    where: { id: params.id, userId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
