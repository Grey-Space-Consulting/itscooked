import { SourcePlatform } from "@prisma/client";

type ImportMetadata = {
  title?: string;
  description?: string;
  authorName?: string;
  thumbnailUrl?: string;
};

type ParsedRecipe = {
  title?: string;
  ingredientsList: string[];
  instructionsList: string[];
};

export type ImportResult = {
  title?: string;
  ingredientsList: string[];
  instructionsList: string[];
  originalCreator?: string;
  thumbnailUrl?: string;
  warnings: string[];
};

const TIKTOK_OEMBED_URL = "https://www.tiktok.com/oembed";
const MAX_TEXT_LENGTH = 8000;
const MAX_LINE_LENGTH = 240;

const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page (${response.status}).`);
  }

  const text = await response.text();
  return text.slice(0, MAX_TEXT_LENGTH);
};

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readMetaTag = (html: string, key: string): string | undefined => {
  const escaped = escapeRegExp(key);
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const match = html.match(regex);
  if (!match) {
    return undefined;
  }

  return decodeHtmlEntities(match[1].trim());
};

const readTitleTag = (html: string): string | undefined => {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match) {
    return undefined;
  }

  return decodeHtmlEntities(match[1].trim());
};

const normalizeInstagramDescription = (
  description: string,
): { caption?: string; authorName?: string } => {
  const authorMatch = description.match(/^(.+?) on Instagram:/i);
  const authorName = authorMatch ? authorMatch[1].trim() : undefined;
  let caption = description;

  if (authorMatch) {
    caption = description.slice(authorMatch[0].length).trim();
  }

  caption = caption
    .replace(/^["\u201c\u201d]+/, "")
    .replace(/["\u201c\u201d]+$/g, "")
    .replace(/\s*·\s*Instagram$/i, "")
    .trim();

  return { caption: caption || undefined, authorName };
};

// Instagram oEmbed is limited to embeds; pull only public HTML metadata here.
const fetchInstagramMetadata = async (url: string): Promise<ImportMetadata> => {
  const html = await fetchHtml(url);
  const ogTitle = readMetaTag(html, "og:title");
  const ogDescription = readMetaTag(html, "og:description");
  const ogImage = readMetaTag(html, "og:image");
  const description = ogDescription ?? readMetaTag(html, "description");
  const { caption, authorName } = description
    ? normalizeInstagramDescription(description)
    : { caption: undefined, authorName: undefined };

  return {
    title: ogTitle ?? readTitleTag(html),
    description: caption ?? description,
    authorName,
    thumbnailUrl: ogImage,
  };
};

const fetchTikTokMetadata = async (url: string): Promise<ImportMetadata> => {
  const response = await fetch(
    `${TIKTOK_OEMBED_URL}?url=${encodeURIComponent(url)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`TikTok oEmbed failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  return {
    title: data.title?.trim() || undefined,
    description: data.title?.trim() || undefined,
    authorName: data.author_name?.trim() || undefined,
    thumbnailUrl: data.thumbnail_url?.trim() || undefined,
  };
};

const fetchMetadata = async (
  url: string,
  platform: SourcePlatform,
): Promise<ImportMetadata | null> => {
  if (platform === SourcePlatform.TIKTOK) {
    return fetchTikTokMetadata(url);
  }

  if (platform === SourcePlatform.INSTAGRAM) {
    return fetchInstagramMetadata(url);
  }

  return null;
};

const normalizeLines = (value: string): string[] => {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2022/g, "\n- ")
    .replace(/\u2023/g, "\n- ")
    .replace(/\u25e6/g, "\n- ")
    .replace(/\u2043/g, "\n- ")
    .replace(/\t/g, " ");

  return normalized
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/#\w+/g, "").trim())
    .filter((line) => line.length > 0);
};

const stripListPrefix = (line: string): string =>
  line.replace(/^([-*]|\d+\.|\d+\)|step\s+\d+:)\s*/i, "").trim();

const INGREDIENT_HEADING = /^(ingredients?|what you need|for the sauce)\b[:\s-]*/i;
const INSTRUCTION_HEADING = /^(instructions?|directions?|method|steps?)\b[:\s-]*/i;

const MEASURE_WORDS = [
  "cup",
  "cups",
  "tsp",
  "teaspoon",
  "tbsp",
  "tablespoon",
  "oz",
  "ounce",
  "g",
  "gram",
  "kg",
  "ml",
  "l",
  "lb",
  "pound",
  "pinch",
  "clove",
  "cloves",
  "slice",
  "slices",
];

const measureRegex = new RegExp(`\\b(?:${MEASURE_WORDS.join("|")})\\b`, "i");

const looksLikeIngredient = (line: string): boolean =>
  /\d/.test(line) || measureRegex.test(line);

const parseRecipeText = (text: string): ParsedRecipe => {
  const lines = normalizeLines(text);
  const ingredients: string[] = [];
  const instructions: string[] = [];
  let section: "ingredients" | "instructions" | null = null;
  let foundHeading = false;

  for (const rawLine of lines) {
    if (INGREDIENT_HEADING.test(rawLine)) {
      section = "ingredients";
      foundHeading = true;
      continue;
    }

    if (INSTRUCTION_HEADING.test(rawLine)) {
      section = "instructions";
      foundHeading = true;
      continue;
    }

    const cleaned = stripListPrefix(rawLine);

    if (!cleaned) {
      continue;
    }

    if (section === "ingredients") {
      ingredients.push(cleaned);
      continue;
    }

    if (section === "instructions") {
      instructions.push(cleaned);
      continue;
    }
  }

  if (!foundHeading) {
    for (const rawLine of lines) {
      const cleaned = stripListPrefix(rawLine);
      if (!cleaned) {
        continue;
      }

      if (looksLikeIngredient(cleaned)) {
        ingredients.push(cleaned);
      } else {
        instructions.push(cleaned);
      }
    }
  }

  const titleCandidate = lines.find(
    (line) =>
      !INGREDIENT_HEADING.test(line) &&
      !INSTRUCTION_HEADING.test(line) &&
      !looksLikeIngredient(line) &&
      line.length <= 80,
  );

  return {
    title: titleCandidate,
    ingredientsList: ingredients.map((item) => item.slice(0, MAX_LINE_LENGTH)),
    instructionsList: instructions.map((item) => item.slice(0, MAX_LINE_LENGTH)),
  };
};

export const importRecipeFromUrl = async (params: {
  url: string;
  platform: SourcePlatform;
  fallbackTitle?: string;
}): Promise<ImportResult> => {
  const warnings: string[] = [];
  let metadata: ImportMetadata | null = null;

  try {
    metadata = await fetchMetadata(params.url, params.platform);
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? error.message
        : "Unable to fetch post metadata.",
    );
  }

  const textForParsing = metadata?.description ?? metadata?.title ?? "";
  const parsed = textForParsing ? parseRecipeText(textForParsing) : null;

  if (!textForParsing) {
    warnings.push("No caption text was available to parse.");
  }

  const ingredientsList = parsed?.ingredientsList ?? [];
  const instructionsList = parsed?.instructionsList ?? [];

  if (!ingredientsList.length) {
    warnings.push("Ingredients were not detected.");
  }

  if (!instructionsList.length) {
    warnings.push("Instructions were not detected.");
  }

  return {
    title: params.fallbackTitle ?? parsed?.title ?? metadata?.title,
    ingredientsList,
    instructionsList,
    originalCreator: metadata?.authorName,
    thumbnailUrl: metadata?.thumbnailUrl,
    warnings,
  };
};
