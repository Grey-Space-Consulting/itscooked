import { SourcePlatform } from "@prisma/client";

const MAX_TITLE_LENGTH = 140;
const MAX_URL_LENGTH = 2000;

type RecipeCreatePayload = {
  url: string;
  title?: string;
  sourcePlatform: SourcePlatform;
};

type RecipeCreateResult =
  | { data: RecipeCreatePayload }
  | { error: string };

const PLATFORM_DOMAINS = [
  { domain: "instagram.com", platform: SourcePlatform.INSTAGRAM },
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
