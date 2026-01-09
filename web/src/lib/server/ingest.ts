import { randomUUID } from "crypto";
import type { IngestJob } from "../api/types";
import type { StoredIngestJob, StoredRecipe, Store } from "./store";

const PROCESSING_DELAY_MS = 4000;
const READY_DELAY_MS = 12000;

const toTitleCase = (value: string) =>
  value.replace(/\w\S*/g, (word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

const deriveTitleFromUrl = (sourceUrl?: string) => {
  if (!sourceUrl) {
    return "Imported recipe";
  }

  try {
    const url = new URL(sourceUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] ?? "";
    const cleaned = decodeURIComponent(slug).replace(/[-_]+/g, " ").trim();
    if (cleaned) {
      return toTitleCase(cleaned);
    }
    return toTitleCase(url.hostname.replace(/^www\./, ""));
  } catch {
    return "Imported recipe";
  }
};

const buildRecipeFromIngest = (
  job: StoredIngestJob,
  nowIso: string
): StoredRecipe => ({
  id: randomUUID(),
  userId: job.userId,
  title: deriveTitleFromUrl(job.sourceUrl),
  updatedAt: nowIso,
  createdAt: nowIso,
  summary: job.sourceUrl
    ? `Imported from ${job.sourceUrl}`
    : "Imported from a shared recipe link.",
  notes: "Parser not configured yet. Review the source link for details.",
  sourceUrl: job.sourceUrl,
  ingredients: [],
  steps: []
});

export function advanceIngestJob(store: Store, job: StoredIngestJob): StoredIngestJob {
  const now = Date.now();
  const createdAtMs = new Date(job.createdAt).getTime();
  const updatedAtMs = new Date(job.updatedAt).getTime();
  const ageMs = now - createdAtMs;

  if (job.status === "queued" && ageMs >= PROCESSING_DELAY_MS) {
    job.status = "processing";
    job.statusMessage = "Parsing in progress.";
    job.updatedAt = new Date(now).toISOString();
  }

  if (job.status === "processing" && ageMs >= READY_DELAY_MS) {
    job.status = "ready";
    job.statusMessage = "Ready to review.";
    job.updatedAt = new Date(now).toISOString();

    if (!job.recipeId) {
      const recipe = buildRecipeFromIngest(job, job.updatedAt);
      store.recipes[recipe.id] = recipe;
      job.recipeId = recipe.id;
    }
  }

  if (job.status === "error" && updatedAtMs < createdAtMs) {
    job.updatedAt = new Date(now).toISOString();
  }

  return job;
}

export const serializeIngestJob = (job: StoredIngestJob): IngestJob => ({
  id: job.id,
  status: job.status,
  sourceUrl: job.sourceUrl,
  recipeId: job.recipeId,
  statusMessage: job.statusMessage,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt
});

export const createIngestJob = (store: Store, userId: string, sourceUrl: string) => {
  const nowIso = new Date().toISOString();
  const job: StoredIngestJob = {
    id: randomUUID(),
    userId,
    status: "queued",
    sourceUrl,
    createdAt: nowIso,
    updatedAt: nowIso,
    statusMessage: "Queued for parsing."
  };

  store.ingests[job.id] = job;
  return job;
};

export const retryIngestJob = (job: StoredIngestJob) => {
  const nowIso = new Date().toISOString();
  job.status = "queued";
  job.statusMessage = "Queued for parsing.";
  job.updatedAt = nowIso;
  return job;
};
