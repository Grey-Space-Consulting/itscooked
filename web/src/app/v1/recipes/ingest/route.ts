import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { loadStore, saveStore } from "@/lib/server/store";
import { createIngestJob, serializeIngestJob } from "@/lib/server/ingest";
import { badRequest, respondWithError, validationError } from "@/lib/server/apiErrors";

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
      throw badRequest("Invalid request body.");
    }

    const sourceUrl =
      typeof body.source_url === "string" ? body.source_url.trim() : "";
    if (!sourceUrl || !isValidUrl(sourceUrl)) {
      throw validationError("source_url must be a valid http or https URL.", {
        field: "source_url"
      });
    }

    const store = await loadStore();
    const job = createIngestJob(store, userId, sourceUrl);
    await saveStore(store);

    return NextResponse.json(serializeIngestJob(job), { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
