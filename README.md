# Malta

September feeding calendar for Malta, a grey-and-white cat. Friends pick a name (no login), tap a day, and keep the tiny tiger fed.

Spawned from [nuxt-app-template](https://github.com/PReynaud/nuxt-app-template) by [software-factory](https://github.com/PReynaud/software-factory).

## Stack

- Nuxt 4, Nuxt UI 4, Pinia
- Supabase (SQL migrations + RLS)
- Playwright (local Supabase only) and Vitest
- BMAD Method, Cursor rules, MCP (Nuxt, Nuxt UI, Playwright, Supabase, Vercel)
- PWA via `@vite-pwa/nuxt`

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:start
pnpm db:reset
pnpm db:types
pnpm pwa:icons
pnpm dev
```

Production URL (after DNS): https://malta.pierre-reynaud.fr

## Production migrations

On push to `main` (paths under `supabase/migrations/**`), `.github/workflows/deploy-migrations.yml` runs `supabase db push --db-url`. Set the repo secret `SUPABASE_DB_URL` to the direct Postgres URI:

`postgresql://postgres:{password}@db.{project_ref}.supabase.co:5432/postgres`

(`factory-new-app` sets this during bootstrap.) Never commit the URI. Do not push `seed.sql` to production.

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e
```

A pre-commit hook runs `eslint --fix` on staged JS/TS/Vue files. Do not skip it with `--no-verify`.

Playwright refuses non-local Supabase URLs. Create accounts per test; they are deleted afterwards.

## Language

Conversation may be English or French. All produced artifacts are English.
