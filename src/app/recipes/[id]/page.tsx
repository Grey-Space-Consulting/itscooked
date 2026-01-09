import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPlatformLabel, normalizeStringList } from "@/lib/recipes";
import styles from "../recipes.module.css";

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
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>IC</span>
          <span>ItsCooked</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/recipes" className={styles.ghostButton}>
            Back to recipes
          </Link>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <h1>{recipe.title ?? "Untitled recipe"}</h1>
              <p>
                Saved from {formatPlatformLabel(recipe.sourcePlatform)} on{" "}
                {recipe.createdAt.toLocaleDateString()}
              </p>
            </div>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.secondaryButton}
            >
              View original
            </a>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailSection}>
              <h2>Ingredients</h2>
              {ingredients.length ? (
                <ul className={styles.detailList}>
                  {ingredients.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.detailEmpty}>
                  No ingredients captured yet.
                </p>
              )}
            </div>
            <div className={styles.detailSection}>
              <h2>Instructions</h2>
              {instructions.length ? (
                <ol className={styles.detailList}>
                  {instructions.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className={styles.detailEmpty}>
                  No instructions captured yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
