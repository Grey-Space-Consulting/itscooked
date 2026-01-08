"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { TextInput } from "../components/ui/Input";
import { Section } from "../components/ui/Section";
import { fetchRecipes } from "../lib/api/endpoints";
import { useApiClient } from "../lib/api/useApiClient";
import type { RecipeSummary } from "../lib/api/types";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";
import { useAppDispatch } from "../lib/state/AppState";
import { formatRelativeTime, formatShortTime } from "../lib/utils";

export function Recipes() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApiClient();
  const isOnline = useOnlineStatus();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setRecipes([]);
      setError(null);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isOnline) {
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchRecipes(api);
        if (!isActive) {
          return;
        }
        setRecipes(result);
        dispatch({
          type: "setLastSync",
          value: formatShortTime(new Date())
        });
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Unable to load recipes.";
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
  }, [api, dispatch, isLoaded, isOnline, isSignedIn]);

  const filteredRecipes = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return recipes;
    }

    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(trimmedQuery)
    );
  }, [query, recipes]);

  const showAuthPrompt = isLoaded && !isSignedIn;

  return (
    <div className="page stack">
      <Section
        title="Recipes"
        subtitle="Search, review, and edit your latest imports"
      >
        {showAuthPrompt && (
          <Callout
            title="Sign in to sync"
            description="Connect your account to load your latest recipes."
            action={
              <div className="auth-actions">
                <SignInButton />
                <SignUpButton />
              </div>
            }
          />
        )}

        {!isOnline && (
          <Callout
            title="You're offline"
            description="Reconnect to refresh recipe data."
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

        <TextInput
          label="Search"
          placeholder="Search by ingredient or title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {isLoading && (
          <Card>
            <p className="card-meta">Loading recipes...</p>
          </Card>
        )}

        {!isLoading && filteredRecipes.length === 0 && (
          <Card>
            <p className="card-meta">
              {isSignedIn
                ? "No recipes yet. Add a new URL to start importing."
                : "Sign in to see your recipe library."}
            </p>
          </Card>
        )}

        <div className="grid grid-2">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              title={recipe.title}
              meta={formatRelativeTime(recipe.updatedAt)}
              action={
                <Link className="badge" href={`/recipes/${recipe.id}`}>
                  Open
                </Link>
              }
            >
              <div className="stack">
                <p className="card-meta">
                  {recipe.servings
                    ? `${recipe.servings} servings`
                    : "Tap to open the full recipe details."}
                </p>
                {recipe.totalTimeMinutes && (
                  <span className="badge">{recipe.totalTimeMinutes} min</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
