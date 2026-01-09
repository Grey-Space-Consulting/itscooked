declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
    CLERK_SECRET_KEY?: string;
    DATABASE_URL?: string;
    POSTGRES_URL?: string;
    VERCEL_POSTGRES_URL?: string;
    ITSCOOKED_DATABASE_URL?: string;
    ITSCOOKED_DATA_DIR?: string;
  }
}
