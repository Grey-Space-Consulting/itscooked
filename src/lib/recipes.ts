import { SourcePlatform } from "@prisma/client";

const MAX_TITLE_LENGTH = 140;
const MAX_URL_LENGTH = 2000;
const MAX_LIST_ITEMS = 200;
const MAX_LIST_ITEM_LENGTH = 240;

type RecipeCreatePayload = {
  url: string;
  title?: string;
  sourcePlatform: SourcePlatform;
};

type RecipeCreateResult =
  | { data: RecipeCreatePayload }
  | { error: string };

type RecipeUpdatePayload = {
  title?: string | null;
  ingredientsList?: string[] | null;
  instructionsList?: string[] | null;
};

type RecipeUpdateResult = { data: RecipeUpdatePayload } | { error: string };

const PLATFORM_DOMAINS = [
  { domain: "instagram.com", platform: SourcePlatform.INSTAGRAM },
  { domain: "instagr.am", platform: SourcePlatform.INSTAGRAM },
  { domain: "tiktok.com", platform: SourcePlatform.TIKTOK },
];

const matchesDomain = (hostname: string, domain: string) =>
  hostname === domain || hostname.endsWith(`.${domain}`);

export const parseRecipeCreateBody = (body: unknown): RecipeCreateResult => {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const record = body as Record<string, unknown>;
  const rawUrl = typeof record.url === "string" ? record.url.trim() : "";
  const rawTitle = typeof record.title === "string" ? record.title.trim() : "";

  if (!rawUrl) {
    return { error: "Recipe URL is required." };
  }

  if (rawUrl.length > MAX_URL_LENGTH) {
    return { error: "Recipe URL is too long." };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { error: "Recipe URL must be valid." };
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return { error: "Recipe URL must start with http or https." };
  }

  const sourcePlatform = detectSourcePlatform(parsedUrl.hostname);

  if (sourcePlatform === SourcePlatform.UNKNOWN) {
    return {
      error: "Only Instagram or TikTok links are supported right now.",
    };
  }

  if (rawTitle.length > MAX_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
    };
  }

  return {
    data: {
      url: normalizeRecipeUrl(parsedUrl),
      title: rawTitle || undefined,
      sourcePlatform,
    },
  };
};

const splitTextList = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const normalizeListInput = (
  value: unknown,
  label: string,
): { value?: string[] | null; error?: string } => {
  if (value === undefined) {
    return { value: undefined };
  }

  if (value === null) {
    return { value: null };
  }

  let list: string[];

  if (typeof value === "string") {
    list = splitTextList(value);
  } else if (Array.isArray(value)) {
    list = value.filter((item): item is string => typeof item === "string");
  } else {
    return { error: `${label} must be a list or a text block.` };
  }

  const cleaned = list
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.slice(0, MAX_LIST_ITEM_LENGTH));

  if (cleaned.length > MAX_LIST_ITEMS) {
    return {
      error: `${label} must be ${MAX_LIST_ITEMS} items or fewer.`,
    };
  }

  return { value: cleaned };
};

export const parseRecipeUpdateBody = (body: unknown): RecipeUpdateResult => {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const record = body as Record<string, unknown>;
  const titleValue = record.title;
  const rawTitle = typeof titleValue === "string" ? titleValue.trim() : undefined;
  const hasTitle = rawTitle !== undefined;

  if (rawTitle && rawTitle.length > MAX_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
    };
  }

  const ingredientsInput = normalizeListInput(
    record.ingredients ?? record.ingredientsList,
    "Ingredients",
  );
  if (ingredientsInput.error) {
    return { error: ingredientsInput.error };
  }

  const instructionsInput = normalizeListInput(
    record.instructions ?? record.instructionsList,
    "Instructions",
  );
  if (instructionsInput.error) {
    return { error: instructionsInput.error };
  }

  return {
    data: {
      title: hasTitle ? (rawTitle ? rawTitle : null) : undefined,
      ingredientsList: ingredientsInput.value,
      instructionsList: instructionsInput.value,
    },
  };
};

export const detectSourcePlatform = (hostname: string): SourcePlatform => {
  const host = hostname.toLowerCase();

  for (const { domain, platform } of PLATFORM_DOMAINS) {
    if (matchesDomain(host, domain)) {
      return platform;
    }
  }

  return SourcePlatform.UNKNOWN;
};

export const normalizeRecipeUrl = (url: URL): string => {
  const normalized = new URL(url.toString());

  normalized.search = "";
  normalized.hash = "";

  if (normalized.pathname.endsWith("/") && normalized.pathname !== "/") {
    normalized.pathname = normalized.pathname.slice(0, -1);
  }

  return normalized.toString();
};

export const formatPlatformLabel = (platform: SourcePlatform): string => {
  switch (platform) {
    case SourcePlatform.INSTAGRAM:
      return "Instagram";
    case SourcePlatform.TIKTOK:
      return "TikTok";
    default:
      return "Unknown";
  }
};

export const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};
