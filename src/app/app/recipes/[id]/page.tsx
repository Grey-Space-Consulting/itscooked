import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPlatformLabel, normalizeStringList } from "@/lib/recipes";
import styles from "./recipe-detail.module.css";

type RecipeDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
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
      originalCreator: true,
      thumbnailUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!recipe) {
    notFound();
  }

  const ingredients = normalizeStringList(recipe.ingredientsList);
  const instructions = normalizeStringList(recipe.instructionsList);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{recipe.title ?? "Untitled recipe"}</h1>
          <p>
            Saved from {formatPlatformLabel(recipe.sourcePlatform)} on{" "}
            {recipe.createdAt.toLocaleDateString()}
          </p>
          {recipe.originalCreator ? (
            <span className={styles.creator}>by {recipe.originalCreator}</span>
          ) : null}
        </div>
        <div className={styles.actions}>
          <Link
            href={`/app/recipes/${recipe.id}/edit`}
            className={styles.secondaryButton}
          >
            Edit recipe
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

      {recipe.thumbnailUrl ? (
        <div className={styles.heroMedia}>
          <img src={recipe.thumbnailUrl} alt="Recipe thumbnail" />
        </div>
      ) : null}

      <section className={styles.detailGrid}>
        <div className={styles.detailCard}>
          <h2>Ingredients</h2>
          {ingredients.length ? (
            <ul className={styles.detailList}>
              {ingredients.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.detailEmpty}>No ingredients captured yet.</p>
          )}
        </div>
        <div className={styles.detailCard}>
          <h2>Instructions</h2>
          {instructions.length ? (
            <ol className={styles.detailList}>
              {instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className={styles.detailEmpty}>No instructions captured yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
