import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { loadStore, saveStore } from "@/lib/server/store";
import { createRecipe, serializeRecipe, serializeSummary } from "@/lib/server/recipes";
import { badRequest, respondWithError, validationError } from "@/lib/server/apiErrors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const store = await loadStore();
    const recipes = Object.values(store.recipes)
      .filter((recipe) => recipe.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(serializeSummary);

    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw badRequest("Invalid request body.");
    }

    if (typeof body.title !== "string" || !body.title.trim()) {
      throw validationError("Recipe title is required.", { field: "title" });
    }

    const store = await loadStore();
    const recipe = createRecipe(userId, body);
    store.recipes[recipe.id] = recipe;
    await saveStore(store);

    return NextResponse.json(serializeRecipe(recipe), { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
