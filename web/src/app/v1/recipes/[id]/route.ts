import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { loadStore, saveStore } from "@/lib/server/store";
import { serializeRecipe, updateRecipe } from "@/lib/server/recipes";
import { badRequest, notFound, respondWithError } from "@/lib/server/apiErrors";

export const runtime = "nodejs";

const getRecipe = async (userId: string, recipeId: string) => {
  const store = await loadStore();
  const recipe = store.recipes[recipeId];
  if (!recipe || recipe.userId !== userId) {
    return { store, recipe: null };
  }
  return { store, recipe };
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await context.params;
    const { recipe } = await getRecipe(userId, id);
    if (!recipe) {
      throw notFound("Recipe not found.");
    }
    return NextResponse.json(serializeRecipe(recipe), { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw badRequest("Invalid request body.");
    }

    const { store, recipe } = await getRecipe(userId, id);
    if (!recipe) {
      throw notFound("Recipe not found.");
    }

    const updated = updateRecipe(recipe, body);
    store.recipes[recipe.id] = updated;
    await saveStore(store);

    return NextResponse.json(serializeRecipe(updated), { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await context.params;
    const { store, recipe } = await getRecipe(userId, id);
    if (!recipe) {
      throw notFound("Recipe not found.");
    }

    delete store.recipes[id];
    await saveStore(store);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
