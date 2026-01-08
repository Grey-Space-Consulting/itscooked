import type { RecipeDetail, RecipeSummary, UserProfile } from "./types";
import type { ApiClient } from "./client";

const extractList = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const record = value as { items?: T[]; data?: T[] };
    if (Array.isArray(record.items)) {
      return record.items;
    }
    if (Array.isArray(record.data)) {
      return record.data;
    }
  }

  return [];
};

export async function fetchRecipes(api: ApiClient): Promise<RecipeSummary[]> {
  const response = await api.get<unknown>("/v1/recipes");
  return extractList<RecipeSummary>(response);
}

export async function fetchRecipe(
  api: ApiClient,
  recipeId: string
): Promise<RecipeDetail> {
  return api.get<RecipeDetail>(`/v1/recipes/${encodeURIComponent(recipeId)}`);
}

export async function fetchMe(api: ApiClient): Promise<UserProfile> {
  return api.get<UserProfile>("/v1/me");
}
