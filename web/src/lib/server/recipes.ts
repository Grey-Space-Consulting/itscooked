import { randomUUID } from "crypto";
import type { RecipeDetail, RecipeSummary } from "../api/types";
import type { StoredRecipe } from "./store";

const nowIso = () => new Date().toISOString();

export const serializeRecipe = (recipe: StoredRecipe): RecipeDetail => ({
  id: recipe.id,
  title: recipe.title,
  updatedAt: recipe.updatedAt,
  summary: recipe.summary,
  notes: recipe.notes,
  sourceUrl: recipe.sourceUrl,
  totalTimeMinutes: recipe.totalTimeMinutes,
  servings: recipe.servings,
  ingredients: recipe.ingredients,
  steps: recipe.steps
});

export const serializeSummary = (recipe: StoredRecipe): RecipeSummary => ({
  id: recipe.id,
  title: recipe.title,
  updatedAt: recipe.updatedAt,
  totalTimeMinutes: recipe.totalTimeMinutes,
  servings: recipe.servings
});

export const createRecipe = (
  userId: string,
  payload: Partial<RecipeDetail>
): StoredRecipe => ({
  id: randomUUID(),
  userId,
  title: payload.title?.trim() || "Untitled recipe",
  summary: payload.summary,
  notes: payload.notes,
  sourceUrl: payload.sourceUrl,
  totalTimeMinutes: payload.totalTimeMinutes,
  servings: payload.servings,
  ingredients: payload.ingredients ?? [],
  steps: payload.steps ?? [],
  createdAt: nowIso(),
  updatedAt: nowIso()
});

export const updateRecipe = (
  recipe: StoredRecipe,
  payload: Partial<RecipeDetail>
): StoredRecipe => ({
  ...recipe,
  title: typeof payload.title === "string" ? payload.title : recipe.title,
  summary: typeof payload.summary === "string" ? payload.summary : recipe.summary,
  notes: typeof payload.notes === "string" ? payload.notes : recipe.notes,
  sourceUrl: typeof payload.sourceUrl === "string" ? payload.sourceUrl : recipe.sourceUrl,
  totalTimeMinutes:
    typeof payload.totalTimeMinutes === "number"
      ? payload.totalTimeMinutes
      : recipe.totalTimeMinutes,
  servings:
    typeof payload.servings === "number" ? payload.servings : recipe.servings,
  ingredients: Array.isArray(payload.ingredients)
    ? payload.ingredients
    : recipe.ingredients,
  steps: Array.isArray(payload.steps) ? payload.steps : recipe.steps,
  updatedAt: nowIso()
});
