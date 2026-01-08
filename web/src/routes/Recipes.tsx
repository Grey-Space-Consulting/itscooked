import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { TextInput } from "../components/ui/Input";
import { Section } from "../components/ui/Section";
import { useAuth } from "../lib/auth";
import { fetchRecipes } from "../lib/api/endpoints";
import { useApiClient } from "../lib/api/useApiClient";
import type { RecipeSummary } from "../lib/api/types";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";
import { useAppDispatch } from "../lib/state/AppState";
import { formatRelativeTime, formatShortTime } from "../lib/utils";

export function Recipes() {
  const { status, login, config } = useAuth();
  const api = useApiClient();
  const isOnline = useOnlineStatus();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setRecipes([]);
      setError(null);
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !isOnline) {
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
        const message = err instanceof Error ? err.message : "Unable to load recipes.";
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
  }, [api, dispatch, isOnline, status]);

  const filteredRecipes = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return recipes;
    }

    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(trimmedQuery)
    );
  }, [query, recipes]);

  const showAuthPrompt =
    status === "unauthenticated" || status === "disabled" || status === "error";
  const authDescription = config
    ? "Sign in to sync recipes from the backend."
    : "Auth is not configured yet. Add OIDC env values to enable sign-in.";

  return (
    <div className="page stack">
      <Section
        title="Recipes"
        subtitle="Search, review, and edit your latest imports"
      >
        {showAuthPrompt && (
          <Callout
            title="Connect to ItsCooked"
            description={authDescription}
            variant={config ? "info" : "warning"}
            action={
              config ? <Button onClick={login}>Sign in</Button> : undefined
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
              {status === "authenticated"
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
                <Link className="badge" to={`/recipes/${recipe.id}`}>
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
