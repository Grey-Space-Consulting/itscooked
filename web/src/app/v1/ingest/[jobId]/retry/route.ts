import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { retryIngestJob, serializeIngestJob } from "@/lib/server/ingest";
import { loadStore, saveStore } from "@/lib/server/store";

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
      return NextResponse.json({ message: "Job not found." }, { status: 404 });
    }

    const updated = retryIngestJob(job);
    store.ingests[jobId] = updated;
    await saveStore(store);

    return NextResponse.json(serializeIngestJob(updated), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ message }, { status: 401 });
  }
}
