# LumaOS Core

LumaOS is a personal AI operating layer. Phase 1 establishes the production-quality foundation for authentication, profiles, goals, tasks, memory, and a future context-aware assistant.

## Current architecture

- **Next.js App Router** renders protected application screens and server actions.
- **Auth.js** provides credential-based local authentication and server-side sessions.
- **PostgreSQL + Drizzle ORM** store users, profiles, goals, tasks, memories, conversations, and messages.
- **Zod** validates environment variables and all user input accepted by server actions.
- **Vitest** covers validation and basic ownership logic.

Unfinished future systems: AI model calls, autonomous agents, plugin marketplace, document ingestion, vector embeddings, external integrations, and advanced permissions.

## Tech stack

Next.js, React, TypeScript strict mode, pnpm, Tailwind CSS, Drizzle ORM, PostgreSQL, Auth.js, Zod, and Vitest.

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET`: strong random secret for Auth.js.
- `AUTH_TRUST_HOST`: set to `true` for local/proxy deployments as needed.
- `AI_PROVIDER`, `AI_API_KEY`: placeholders for later phases. No AI provider is implemented in Phase 1.

Never commit real secrets.

## Database setup

Start PostgreSQL locally, set `DATABASE_URL`, then run:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

The initial schema includes `users`, `profiles`, `goals`, `tasks`, `memories`, `conversations`, and `messages`. Memory rows include metadata fields reserved for a later pgvector migration.

## Authentication setup

Phase 1 uses Auth.js credentials authentication for local development. Registration stores a bcrypt password hash and login creates a JWT-backed session. Social providers are intentionally not configured yet.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
