import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { loadStore, saveStore } from "@/lib/server/store";
import { createRecipe, serializeRecipe, serializeSummary } from "@/lib/server/recipes";

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
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ message: "Recipe title is required." }, { status: 400 });
    }

    const store = await loadStore();
    const recipe = createRecipe(userId, body);
    store.recipes[recipe.id] = recipe;
    await saveStore(store);

    return NextResponse.json(serializeRecipe(recipe), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ message }, { status: 401 });
  }
}
