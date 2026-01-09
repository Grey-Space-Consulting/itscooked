import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { loadStore, saveStore } from "@/lib/server/store";
import { createIngestJob, serializeIngestJob } from "@/lib/server/ingest";

export const runtime = "nodejs";

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const sourceUrl =
      typeof body.source_url === "string" ? body.source_url.trim() : "";
    if (!sourceUrl || !isValidUrl(sourceUrl)) {
      return NextResponse.json(
        { message: "source_url must be a valid http or https URL." },
        { status: 400 }
      );
    }

    const store = await loadStore();
    const job = createIngestJob(store, userId, sourceUrl);
    await saveStore(store);

    return NextResponse.json(serializeIngestJob(job), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ message }, { status: 401 });
  }
}
