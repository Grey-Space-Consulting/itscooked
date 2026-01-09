"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import styles from "./recipe-edit.module.css";

type EditRecipeFormProps = {
  recipeId: string;
  sourceUrl: string;
  initialTitle: string;
  initialIngredients: string;
  initialInstructions: string;
};

export default function EditRecipeForm({
  recipeId,
  sourceUrl,
  initialTitle,
  initialIngredients,
  initialInstructions,
}: EditRecipeFormProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ingredients,
          instructions,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to save those changes.");
        pushToast({
          title: "Save failed",
          message: data.error ?? "Unable to save those changes.",
          tone: "error",
        });
        return;
      }

      pushToast({
        title: "Recipe updated",
        message: "Changes saved successfully.",
        tone: "success",
      });
      router.push(`/app/recipes/${recipeId}`);
      router.refresh();
    } catch {
      setError("Unable to save those changes.");
      pushToast({
        title: "Save failed",
        message: "Unable to save those changes.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Give this recipe a name"
        />
      </label>

      <label className={styles.field}>
        <span>Ingredients (one per line)</span>
        <textarea
          value={ingredients}
          onChange={(event) => setIngredients(event.target.value)}
          rows={8}
        />
      </label>

      <label className={styles.field}>
        <span>Instructions (one per line)</span>
        <textarea
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={10}
        />
      </label>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        <Link href={`/app/recipes/${recipeId}`} className={styles.secondaryButton}>
          Cancel
        </Link>
        <a href={sourceUrl} target="_blank" rel="noreferrer" className={styles.linkButton}>
          View source
        </a>
      </div>
    </form>
  );
}
