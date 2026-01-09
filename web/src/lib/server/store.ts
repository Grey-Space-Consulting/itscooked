import { promises as fs } from "fs";
import path from "path";
import type { IngestJob, RecipeDetail, UserProfile } from "../api/types";

type StoredRecipe = RecipeDetail & {
  userId: string;
  createdAt: string;
};

type StoredIngestJob = IngestJob & {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  users: Record<string, UserProfile>;
  recipes: Record<string, StoredRecipe>;
  ingests: Record<string, StoredIngestJob>;
};

const defaultStore = (): Store => ({
  users: {},
  recipes: {},
  ingests: {}
});

const resolveDataDir = () => {
  if (process.env.ITSCOOKED_DATA_DIR) {
    return process.env.ITSCOOKED_DATA_DIR;
  }
  if (process.env.VERCEL) {
    return "/tmp/itscooked";
  }
  return path.join(process.cwd(), ".data");
};

const storePath = () => path.join(resolveDataDir(), "store.json");

let writeQueue: Promise<void> = Promise.resolve();

export async function loadStore(): Promise<Store> {
  const filePath = storePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return {
      users: parsed.users ?? {},
      recipes: parsed.recipes ?? {},
      ingests: parsed.ingests ?? {}
    };
  } catch {
    return defaultStore();
  }
}

export async function saveStore(store: Store): Promise<void> {
  const dir = resolveDataDir();
  const filePath = storePath();
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
  });
  return writeQueue;
}

export type { Store, StoredIngestJob, StoredRecipe };
