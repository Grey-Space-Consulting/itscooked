# ItsCooked

Social Recipe Saver is a mobile-first web app for capturing recipes from Instagram and TikTok, extracting ingredients/instructions, and generating grocery lists.

## Stack
- Next.js 16 (App Router) + React 19
- Clerk for auth
- PostgreSQL + Prisma 7

## Requirements
- Node.js 24.12.0 (see `.nvmrc`)
- A PostgreSQL database URL for Prisma

## Environment
Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/itscooked?schema=public"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
```

## Getting started
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Database
Prisma config lives in `prisma.config.ts` (Prisma 7+). To apply migrations:

```bash
npx prisma migrate dev
```

## Scripts
- `npm run dev` - start dev server
- `npm run build` - build production assets
- `npm run start` - run production server
- `npm run lint` - lint
