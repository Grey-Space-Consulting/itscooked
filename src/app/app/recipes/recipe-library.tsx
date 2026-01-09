"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import styles from "./recipe-library.module.css";

export type RecipeSummary = {
  id: string;
  title: string | null;
  sourceUrl: string;
  sourcePlatform: "INSTAGRAM" | "TIKTOK" | "UNKNOWN";
  createdAt: string;
  originalCreator: string | null;
  thumbnailUrl: string | null;
};

type RecipeLibraryProps = {
  initialRecipes: RecipeSummary[];
};

type SortOption = "newest" | "oldest" | "title";

type PlatformFilter = "ALL" | "INSTAGRAM" | "TIKTOK";

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

export default function RecipeLibrary({ initialRecipes }: RecipeLibraryProps) {
  const { pushToast } = useToast();
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const [searchTerm, setSearchTerm] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [confirmTarget, setConfirmTarget] = useState<RecipeSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRecipes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let next = recipes;

    if (platform !== "ALL") {
      next = next.filter((recipe) => recipe.sourcePlatform === platform);
    }

    if (term) {
      next = next.filter((recipe) => {
        const title = recipe.title ?? "Untitled recipe";
        return (
          title.toLowerCase().includes(term) ||
          formatHost(recipe.sourceUrl).toLowerCase().includes(term) ||
          (recipe.originalCreator ?? "").toLowerCase().includes(term)
        );
      });
    }

    const sorted = [...next];

    sorted.sort((a, b) => {
      if (sortBy === "title") {
        return (a.title ?? "").localeCompare(b.title ?? "");
      }

      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? right - left : left - right;
    });

    return sorted;
  }, [recipes, searchTerm, platform, sortBy]);

  const handleDelete = async () => {
    if (!confirmTarget) {
      return;
    }

    setDeletingId(confirmTarget.id);

    try {
      const response = await fetch(`/api/recipes/${confirmTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        pushToast({
          title: "Delete failed",
          message: data.error ?? "Unable to delete that recipe.",
          tone: "error",
        });
        return;
      }

      setRecipes((prev) => prev.filter((recipe) => recipe.id !== confirmTarget.id));
      pushToast({
        title: "Recipe deleted",
        message: "The recipe was removed from your library.",
        tone: "success",
      });
    } catch {
      pushToast({
        title: "Delete failed",
        message: "Unable to delete that recipe right now.",
        tone: "error",
      });
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1>Recipe library</h1>
          <p>Search, sort, and clean up your imported recipes.</p>
        </div>
        <Link href="/app/recipes/new" className={styles.primaryButton}>
          New import
        </Link>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchField}>
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by title, creator, or source"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <label className={styles.selectField}>
          <span>Platform</span>
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value as PlatformFilter)}
          >
            <option value="ALL">All</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span>Sort</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A-Z</option>
          </select>
        </label>
        <div className={styles.countPill}>{filteredRecipes.length} results</div>
      </section>

      {filteredRecipes.length === 0 ? (
        <section className={styles.emptyState}>
          <div>
            <h2>No recipes found</h2>
            <p>
              {recipes.length === 0
                ? "Start by importing a recipe from Instagram or TikTok."
                : "Try adjusting your search or filters."}
            </p>
          </div>
          <Link href="/app/recipes/new" className={styles.secondaryButton}>
            Import a recipe
          </Link>
        </section>
      ) : (
        <section className={styles.grid}>
          {filteredRecipes.map((recipe) => (
            <article key={recipe.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <Link
                    href={`/app/recipes/${recipe.id}`}
                    className={styles.cardTitle}
                  >
                    {recipe.title ?? "Untitled recipe"}
                  </Link>
                  <div className={styles.cardMeta}>
                    <span>{formatPlatform(recipe.sourcePlatform)}</span>
                    <span>{formatHost(recipe.sourceUrl)}</span>
                    <span>{formatDate(recipe.createdAt)}</span>
                  </div>
                  {recipe.originalCreator ? (
                    <div className={styles.creatorLabel}>
                      by {recipe.originalCreator}
                    </div>
                  ) : null}
                </div>
                {recipe.thumbnailUrl ? (
                  <div className={styles.thumbWrapper}>
                    <img
                      src={recipe.thumbnailUrl}
                      alt="Recipe thumbnail"
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </div>
              <div className={styles.cardActions}>
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
                  onClick={() => setConfirmTarget(recipe)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete recipe?"
        description="This removes the recipe from your library."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
        isBusy={Boolean(deletingId)}
      />
    </div>
  );
}
