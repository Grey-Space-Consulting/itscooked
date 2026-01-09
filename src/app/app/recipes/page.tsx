import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import RecipeLibrary, { type RecipeSummary } from "./recipe-library";

export default async function RecipesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
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
      originalCreator: true,
      thumbnailUrl: true,
    },
  });

  const initialRecipes: RecipeSummary[] = recipes.map((recipe) => ({
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
  }));

  return <RecipeLibrary initialRecipes={initialRecipes} />;
}
