# LumaOS Core

LumaOS is a personal AI operating layer. Phase 3 adds a context-aware assistant on top of the authentication, profile, goal, task, memory, conversation, and context foundations.

## Current architecture

- **Next.js App Router** renders protected application screens and server actions.
- **Auth.js** provides credential-based local authentication and server-side sessions.
- **PostgreSQL + Drizzle ORM** store users, profiles, goals, tasks, memories, conversations, and messages.
- **Zod** validates environment variables and all user input accepted by server actions.
- **Vitest** covers validation and basic ownership logic.

Unfinished future systems: autonomous agents, plugin marketplace, document ingestion, vector embeddings, external integrations, automatic memory extraction, tool execution, and advanced permissions.

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
- `AI_PROVIDER`: server-only AI provider selector, currently `openai`.
- `AI_API_KEY`: server-only provider API key; never expose with `NEXT_PUBLIC_`.
- `AI_MODEL`: server-only model name.
- `AI_MAX_OUTPUT_TOKENS`: bounded provider response length.
- `AI_TEMPERATURE`: provider temperature when supported.

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

## Phase 3: LumaOS Intelligence Engine

LumaOS now routes assistant requests through a server-only Intelligence Engine instead of exposing a generic chatbot surface. The boundary is: UI → server action → AI service → Context Engine → AI provider → validated application response.

The AI provider is isolated behind `server/services/ai/provider.ts`. The first provider is OpenAI, configured only on the server with `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_MAX_OUTPUT_TOKENS`, and `AI_TEMPERATURE`. Browser code never receives provider credentials and must not import provider code directly.

The AI service in `server/services/ai.ts` validates message input, verifies user-scoped conversation ownership, retrieves bounded recent history, builds structured LumaOS context, invokes the configured provider, normalizes failures, and persists user/assistant messages in the existing `conversations` and `messages` tables.

Context comes from `buildUserContext()` in `server/services/context.ts`. It sends only a bounded representation to the model: profile summary, relevant memories, active goals, and open tasks. The assistant may read relevant memory context, but Phase 3 does not create, update, or extract memories automatically.

Conversation storage remains user-scoped. Client-supplied conversation IDs are validated as UUIDs and then checked against the authenticated user before messages are returned or appended.

Privacy model: LumaOS sends the current request, a limited set of relevant memories, active goals, open tasks, a small profile summary, and bounded recent conversation history to the AI provider. It does not send the entire user database, API keys, passwords, raw prompts, internal configuration, or unnecessary private records.

Current limitations and production requirements: distributed rate limiting is intentionally not implemented yet, but the AI service includes a boundary for it. LumaOS does not yet include agents, tool execution, calendar/email integrations, autonomous actions, vector embeddings, automatic memory extraction, billing, plugins, or marketplace functionality.
