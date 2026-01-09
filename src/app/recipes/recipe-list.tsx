"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import styles from "./recipes.module.css";

export type RecipeSummary = {
  id: string;
  title: string | null;
  sourceUrl: string;
  sourcePlatform: "INSTAGRAM" | "TIKTOK" | "UNKNOWN";
  createdAt: string;
};

type RecipeListProps = {
  initialRecipes: RecipeSummary[];
};

const formatPlatform = (platform: RecipeSummary["sourcePlatform"]) => {
  switch (platform) {
    case "INSTAGRAM":
      return "Instagram";
    case "TIKTOK":
      return "TikTok";
    default:
      return "Unknown";
  }
};

const formatHost = (sourceUrl: string) => {
  try {
    const host = new URL(sourceUrl).hostname.replace("www.", "");
    return host;
  } catch {
    return "source link";
  }
};

const formatDate = (createdAt: string) =>
  new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function RecipeList({ initialRecipes }: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [recipes],
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Add a recipe URL to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        recipe?: RecipeSummary;
        error?: string;
      };

      if (!response.ok || !data.recipe) {
        setError(data.error ?? "Unable to save that recipe.");
        return;
      }

      setRecipes((prev) => [data.recipe, ...prev]);
      setUrl("");
      setTitle("");
    } catch {
      setError("Unable to save that recipe right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recipe?")) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to delete that recipe.");
        return;
      }

      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
    } catch {
      setError("Unable to delete that recipe right now.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.recipesSection}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div>
            <h2>Add a recipe link</h2>
            <p>Instagram and TikTok URLs only for the MVP.</p>
          </div>
          <span className={styles.helperPill}>No extraction yet</span>
        </div>
        <form className={styles.form} onSubmit={handleCreate}>
          <label className={styles.field}>
            <span>Recipe URL</span>
            <input
              type="url"
              name="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.instagram.com/p/..."
              required
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            <span>Title (optional)</span>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Spicy tomato rigatoni"
              className={styles.input}
            />
          </label>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save recipe"}
            </button>
            <span className={styles.helperText}>
              Links are saved privately to your account.
            </span>
          </div>
        </form>
        {error ? (
          <div className={styles.error} role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <div className={styles.listHeader}>
        <div>
          <h2>Saved recipes</h2>
          <p>Tap into a card to view details and extracted steps.</p>
        </div>
        <span className={styles.countPill}>{sortedRecipes.length} total</span>
      </div>

      {sortedRecipes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No recipes saved yet.</div>
          <p>
            Add your first Instagram or TikTok link to start building your list.
          </p>
        </div>
      ) : (
        <div className={styles.recipeGrid}>
          {sortedRecipes.map((recipe) => (
            <article key={recipe.id} className={styles.recipeCard}>
              <div>
                <Link href={`/recipes/${recipe.id}`} className={styles.recipeLink}>
                  <h3>{recipe.title ?? "Untitled recipe"}</h3>
                </Link>
                <div className={styles.recipeMeta}>
                  <span className={styles.metaPill}>
                    {formatPlatform(recipe.sourcePlatform)}
                  </span>
                  <span className={styles.metaPill}>{formatHost(recipe.sourceUrl)}</span>
                  <span className={styles.metaPill}>
                    {formatDate(recipe.createdAt)}
                  </span>
                </div>
              </div>
              <div className={styles.recipeActions}>
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.linkButton}
                >
                  Open source
                </a>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(recipe.id)}
                  disabled={deletingId === recipe.id}
                >
                  {deletingId === recipe.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
