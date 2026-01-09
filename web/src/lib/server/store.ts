import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
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

const STORE_KEY = "default";
const STORE_TABLE = "itscooked_store";

const getDatabaseUrl = () =>
  process.env.ITSCOOKED_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.VERCEL_POSTGRES_URL ??
  "";

const isHostedEnvironment = () =>
  Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const requiresPersistentStore = () => isHostedEnvironment() && !getDatabaseUrl();

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

const ensureDatabase = () => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, max: 1 });
  }
  if (!schemaReady) {
    schemaReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS ${STORE_TABLE} (
          id text PRIMARY KEY,
          payload jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`
      )
      .then(() => undefined);
  }
  return pool;
};

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

const normalizeStore = (raw?: Partial<Store> | null): Store => ({
  users: raw?.users ?? {},
  recipes: raw?.recipes ?? {},
  ingests: raw?.ingests ?? {}
});

const loadStoreFromFile = async (): Promise<Store> => {
  const filePath = storePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return normalizeStore(parsed);
  } catch {
    return defaultStore();
  }
};

const saveStoreToFile = async (store: Store): Promise<void> => {
  const dir = resolveDataDir();
  const filePath = storePath();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
};

const awaitSchema = async () => {
  if (schemaReady) {
    await schemaReady;
  }
};

const loadStoreFromDatabase = async (poolInstance: Pool): Promise<Store> => {
  await awaitSchema();
  const result = await poolInstance.query(
    `SELECT payload FROM ${STORE_TABLE} WHERE id = $1`,
    [STORE_KEY]
  );
  if (result.rows.length === 0) {
    return defaultStore();
  }
  return normalizeStore(result.rows[0]?.payload as Store);
};

const saveStoreToDatabase = async (poolInstance: Pool, store: Store) => {
  await awaitSchema();
  await poolInstance.query(
    `INSERT INTO ${STORE_TABLE} (id, payload, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (id)
     DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
    [STORE_KEY, store]
  );
};

export async function loadStore(): Promise<Store> {
  const db = ensureDatabase();
  if (db) {
    return loadStoreFromDatabase(db);
  }
  if (requiresPersistentStore()) {
    throw new Error(
      "Persistent storage is required. Configure DATABASE_URL or POSTGRES_URL."
    );
  }
  return loadStoreFromFile();
}

export async function saveStore(store: Store): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const db = ensureDatabase();
    if (db) {
      await saveStoreToDatabase(db, store);
      return;
    }
    if (requiresPersistentStore()) {
      throw new Error(
        "Persistent storage is required. Configure DATABASE_URL or POSTGRES_URL."
      );
    }
    await saveStoreToFile(store);
  });
  return writeQueue;
}

export type { Store, StoredIngestJob, StoredRecipe };
