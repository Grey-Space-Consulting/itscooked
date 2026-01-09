import type {
  IngestJob,
  IngestStatus,
  RecipeDetail,
  RecipeSummary,
  UserProfile
} from "./types";
import type { ApiClient } from "./client";

const extractList = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const record = value as { items?: T[]; data?: T[] };
    if (Array.isArray(record.items)) {
      return record.items;
    }
    if (Array.isArray(record.data)) {
      return record.data;
    }
  }

  return [];
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
};

const pickString = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const normalizeIngestStatus = (value?: string): IngestStatus => {
  const normalized = value?.toLowerCase().trim();
  if (!normalized) {
    return "queued";
  }

  if (["ready", "complete", "completed", "done", "success"].includes(normalized)) {
    return "ready";
  }
  if (["error", "failed", "failure"].includes(normalized)) {
    return "error";
  }
  if (["processing", "parsing", "running", "active"].includes(normalized)) {
    return "processing";
  }

  return "queued";
};

const normalizeIngestJob = (
  value: unknown,
  fallbackSourceUrl?: string
): IngestJob => {
  const root = asRecord(value) ?? {};
  const jobRecord = asRecord(root.job) ?? asRecord(root.data) ?? root;
  const dataRecord = asRecord(jobRecord.data);

  const id = pickString(
    jobRecord.id,
    jobRecord.jobId,
    jobRecord.job_id,
    dataRecord?.id,
    dataRecord?.jobId,
    dataRecord?.job_id
  );

  if (!id) {
    throw new Error("Ingest job id missing from API response.");
  }

  const statusSource = pickString(
    jobRecord.status,
    jobRecord.state,
    jobRecord.phase,
    dataRecord?.status,
    dataRecord?.state,
    dataRecord?.phase
  );

  const recipeRecord = asRecord(jobRecord.recipe) ?? asRecord(dataRecord?.recipe);

  return {
    id,
    status: normalizeIngestStatus(statusSource),
    sourceUrl: pickString(
      jobRecord.sourceUrl,
      jobRecord.source_url,
      dataRecord?.sourceUrl,
      dataRecord?.source_url,
      fallbackSourceUrl
    ),
    recipeId: pickString(
      jobRecord.recipeId,
      jobRecord.recipe_id,
      dataRecord?.recipeId,
      dataRecord?.recipe_id,
      recipeRecord?.id
    ),
    statusMessage: pickString(
      jobRecord.message,
      jobRecord.error,
      dataRecord?.message,
      dataRecord?.error
    ),
    createdAt: pickString(
      jobRecord.createdAt,
      jobRecord.created_at,
      dataRecord?.createdAt,
      dataRecord?.created_at
    ),
    updatedAt: pickString(
      jobRecord.updatedAt,
      jobRecord.updated_at,
      dataRecord?.updatedAt,
      dataRecord?.updated_at
    )
  };
};

export async function fetchRecipes(api: ApiClient): Promise<RecipeSummary[]> {
  const response = await api.get<unknown>("/v1/recipes");
  return extractList<RecipeSummary>(response);
}

export async function fetchRecipe(
  api: ApiClient,
  recipeId: string
): Promise<RecipeDetail> {
  return api.get<RecipeDetail>(`/v1/recipes/${encodeURIComponent(recipeId)}`);
}

export async function fetchMe(api: ApiClient): Promise<UserProfile> {
  return api.get<UserProfile>("/v1/me");
}

export async function createIngestJob(
  api: ApiClient,
  sourceUrl: string,
  sourceType?: string
): Promise<IngestJob> {
  const body: Record<string, string> = { source_url: sourceUrl };
  if (sourceType) {
    body.source_type = sourceType;
  }
  const response = await api.post<unknown>("/v1/recipes/ingest", body);
  return normalizeIngestJob(response, sourceUrl);
}

export async function fetchIngestJob(
  api: ApiClient,
  jobId: string
): Promise<IngestJob> {
  const response = await api.get<unknown>(
    `/v1/ingest/${encodeURIComponent(jobId)}`
  );
  return normalizeIngestJob(response);
}

export async function retryIngestJob(
  api: ApiClient,
  jobId: string
): Promise<IngestJob> {
  const response = await api.post<unknown>(
    `/v1/ingest/${encodeURIComponent(jobId)}/retry`
  );
  return normalizeIngestJob(response);
}
