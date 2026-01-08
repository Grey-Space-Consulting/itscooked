"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { List } from "../components/ui/List";
import { Section } from "../components/ui/Section";
import { fetchRecipe } from "../lib/api/endpoints";
import { useApiClient } from "../lib/api/useApiClient";
import type { RecipeDetail as RecipeDetailType } from "../lib/api/types";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";
import { formatRelativeTime } from "../lib/utils";

export function RecipeDetail() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApiClient();
  const isOnline = useOnlineStatus();
  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setRecipe(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !id) {
      return;
    }

    if (!isOnline) {
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchRecipe(api, id);
        if (!isActive) {
          return;
        }
        setRecipe(result);
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Unable to load recipe.";
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [api, id, isLoaded, isOnline, isSignedIn]);

  const ingredientItems = useMemo(() => {
    if (!recipe?.ingredients?.length) {
      return [];
    }

    return recipe.ingredients.map((ingredient) => {
      const parts = [ingredient.quantity, ingredient.unit]
        .filter(Boolean)
        .join(" ");
      const subtitle = [parts, ingredient.note].filter(Boolean).join(" ");
      return {
        title: ingredient.name,
        subtitle: subtitle || undefined,
        trailing: ingredient.aisle ? (
          <span className="badge">{ingredient.aisle}</span>
        ) : undefined
      };
    });
  }, [recipe]);

  const stepItems = useMemo(() => {
    if (!recipe?.steps?.length) {
      return [];
    }

    return [...recipe.steps]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((step, index) => ({
        title: `Step ${index + 1}`,
        subtitle: step.instruction
      }));
  }, [recipe]);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="page stack">
        <Section
          title="Recipe details"
          subtitle="Sign in to open your saved recipes"
        >
          <Card>
            <div className="stack">
              <p className="card-meta">
                Connect your account to fetch recipe details from the backend.
              </p>
              <div className="hero-actions">
                <SignInButton />
                <SignUpButton />
                <Link className="btn btn-ghost" href="/recipes">
                  Back to recipes
                </Link>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    );
  }

  return (
    <div className="page stack">
      <Section
        title={recipe?.title ?? "Recipe"}
        subtitle={
          recipe?.updatedAt
            ? formatRelativeTime(recipe.updatedAt)
            : "Freshly synced"
        }
      >
        {!isOnline && (
          <Callout
            title="You're offline"
            description="Reconnect to refresh this recipe."
            variant="warning"
          />
        )}
        {error && (
          <Callout
            title="Recipe sync failed"
            description={error}
            variant="error"
          />
        )}
        <Card>
          <div className="stack">
            {isLoading && <p className="card-meta">Loading recipe...</p>}
            {!isLoading && !error && recipe?.summary && (
              <p className="card-meta">{recipe.summary}</p>
            )}
            {!isLoading && !recipe?.summary && (
              <p className="card-meta">
                {recipe
                  ? "Add notes or edit the summary once editing is enabled."
                  : "Recipe details will appear once the sync completes."}
              </p>
            )}
            <div className="hero-actions">
              <Link className="btn btn-outline" href="/recipes">
                Back to recipes
              </Link>
              {recipe?.sourceUrl && (
                <a
                  className="btn btn-ghost"
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View source
                </a>
              )}
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Ingredients" subtitle="Measured and grouped for prep">
        {ingredientItems.length > 0 ? (
          <List items={ingredientItems} />
        ) : (
          <Card>
            <p className="card-meta">
              No ingredients yet. Once parsing completes they will appear here.
            </p>
          </Card>
        )}
      </Section>

      <Section title="Steps" subtitle="Follow along in order">
        {stepItems.length > 0 ? (
          <List items={stepItems} />
        ) : (
          <Card>
            <p className="card-meta">
              Steps will appear when the recipe finishes processing.
            </p>
          </Card>
        )}
      </Section>
    </div>
  );
}
