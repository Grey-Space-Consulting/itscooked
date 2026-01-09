import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { loadStore, saveStore } from "@/lib/server/store";
import { serializeRecipe, updateRecipe } from "@/lib/server/recipes";

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
      return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
    }
    return NextResponse.json(serializeRecipe(recipe), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ message }, { status: 401 });
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
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const { store, recipe } = await getRecipe(userId, id);
    if (!recipe) {
      return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
    }

    const updated = updateRecipe(recipe, body);
    store.recipes[recipe.id] = updated;
    await saveStore(store);

    return NextResponse.json(serializeRecipe(updated), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ message }, { status: 401 });
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
      return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
    }

    delete store.recipes[id];
    await saveStore(store);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ message }, { status: 401 });
  }
}
