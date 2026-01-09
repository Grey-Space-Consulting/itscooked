import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { retryIngestJob, serializeIngestJob } from "@/lib/server/ingest";
import { loadStore, saveStore } from "@/lib/server/store";
import { notFound, respondWithError } from "@/lib/server/apiErrors";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await requireAuth(request);
    const { jobId } = await context.params;
    const store = await loadStore();
    const job = store.ingests[jobId];
    if (!job || job.userId !== userId) {
      throw notFound("Job not found.");
    }

    const updated = retryIngestJob(job);
    store.ingests[jobId] = updated;
    await saveStore(store);

    return NextResponse.json(serializeIngestJob(updated), { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
