import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import GroceryChecklist from "@/components/grocery-checklist";
import { prisma } from "@/lib/db";
import { normalizeStringList } from "@/lib/recipes";
import styles from "./recipe-grocery.module.css";

type RecipeGroceryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecipeGroceryPage({
  params,
}: RecipeGroceryPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      ingredientsList: true,
      updatedAt: true,
    },
  });

  if (!recipe) {
    notFound();
  }

  const ingredients = normalizeStringList(recipe.ingredientsList);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{recipe.title ?? "Untitled recipe"}</h1>
          <p>Grocery list generated from the saved ingredients.</p>
          <span className={styles.meta}>
            Last updated {recipe.updatedAt.toLocaleDateString()}
          </span>
        </div>
        <div className={styles.actions}>
          <Link
            href={`/app/recipes/${recipe.id}`}
            className={styles.secondaryButton}
          >
            Back to recipe
          </Link>
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.primaryButton}
          >
            View original
          </a>
        </div>
      </header>

      <GroceryChecklist
        recipeId={recipe.id}
        title={recipe.title}
        items={ingredients}
        editHref={`/app/recipes/${recipe.id}/edit`}
      />
    </div>
  );
}
