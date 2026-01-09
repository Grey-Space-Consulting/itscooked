import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { normalizeStringList } from "@/lib/recipes";
import EditRecipeForm from "./recipe-edit-form";
import styles from "./recipe-edit.module.css";

type RecipeEditPageProps = {
  params: {
    id: string;
  };
};

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      ingredientsList: true,
      instructionsList: true,
      updatedAt: true,
    },
  });

  if (!recipe) {
    notFound();
  }

  const ingredients = normalizeStringList(recipe.ingredientsList).join("\n");
  const instructions = normalizeStringList(recipe.instructionsList).join("\n");

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Edit recipe</h1>
          <p>Clean up extraction results or add your own notes.</p>
        </div>
        <span className={styles.meta}>Last updated {recipe.updatedAt.toDateString()}</span>
      </div>
      <EditRecipeForm
        recipeId={recipe.id}
        sourceUrl={recipe.sourceUrl}
        initialTitle={recipe.title ?? ""}
        initialIngredients={ingredients}
        initialInstructions={instructions}
      />
    </div>
  );
}
