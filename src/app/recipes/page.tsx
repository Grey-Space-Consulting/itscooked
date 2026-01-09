import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import RecipeList from "./recipe-list";
import styles from "./recipes.module.css";
import type { RecipeSummary } from "./recipe-list";

export default async function RecipesPage() {
  const { userId } = auth();

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
    },
  });

  const initialRecipes: RecipeSummary[] = recipes.map((recipe) => ({
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>IC</span>
          <span>ItsCooked</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.ghostButton}>
            Back home
          </Link>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h1>Your recipes</h1>
              <p>Save links now, then refine details once extraction lands.</p>
            </div>
            <span className={styles.metaBadge}>Phase 2</span>
          </div>
          <RecipeList initialRecipes={initialRecipes} />
        </section>
      </main>
    </div>
  );
}
