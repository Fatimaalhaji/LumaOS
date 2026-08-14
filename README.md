# LumaOS Core

LumaOS is a personal AI operating layer built as a protected Next.js application. The current stack includes the Phase 1 product foundation, the Phase 2 Memory and Context Engines, and the Phase 3 Luma Intelligence Engine.

## Architecture

- **App layer:** Next.js App Router renders authenticated dashboard, task, memory, settings, onboarding, and assistant screens.
- **Action layer:** Server actions authenticate every mutation, derive ownership from the active Auth.js session, validate input with Zod, and never trust client-supplied `userId` values.
- **Repository/service layer:** Drizzle repositories and services enforce user-scoped access to goals, tasks, memories, conversations, and messages.
- **Context Engine:** `buildUserContext()` retrieves bounded profile, goal, task, and relevant memory context for downstream AI use.
- **Intelligence Engine:** Assistant server actions call the AI service, which validates messages, verifies conversation ownership, builds context, invokes the configured provider, normalizes errors, and persists conversation messages.
- **Database:** PostgreSQL stores Auth.js identity data plus LumaOS profiles, goals, tasks, memories, conversations, and messages.

## Phase 1 foundation

Phase 1 provides the core application shell: TypeScript, Next.js App Router, Drizzle PostgreSQL, Auth.js credentials authentication, bcrypt password hashing, JWT sessions, user profiles, goals, tasks, memories, conversations, messages, validation, and server-side ownership enforcement.

## Phase 2: Memory and Context Engines

The Memory Engine stores user-owned memories with controlled memory types, controlled memory sources, bounded content, bounded importance, lexical search, and CRUD operations that always scope reads and writes to the authenticated user. UI-created memories are treated as user-created records; automatic memory extraction is intentionally not enabled.

The Context Engine builds structured user context only. It retrieves a bounded profile summary, active goals, open tasks, and lexically relevant memories. It does not call the AI provider and does not generate responses.

## Phase 3: Luma Intelligence Engine

LumaOS routes assistant requests through a server-only Intelligence Engine: UI → server action → AI service → Context Engine → AI provider → validated application response.

The AI provider abstraction lives behind `server/services/ai/provider.ts`. The first implementation is OpenAI, configured only from server-side environment variables. Browser code never imports provider code, never calls OpenAI directly, and never receives provider credentials.

The AI service validates assistant messages, validates optional conversation IDs, verifies conversation ownership, retrieves bounded recent message history, builds bounded LumaOS context, invokes the configured provider, validates non-empty assistant output, normalizes provider failures, and persists user and assistant messages in user-scoped conversations.

## Conversation storage

Conversations belong to users. Messages belong to conversations. Conversation listing, message loading, and assistant appends require an authenticated session and validate ownership before returning or writing conversation data.

## Authentication and privacy model

Auth.js credentials authentication stores bcrypt password hashes and uses JWT-backed sessions. All user-owned mutations derive `userId` from the server-side session.

For assistant requests, LumaOS sends only the current request, bounded recent conversation history, a limited profile summary, relevant memories, active goals, and open tasks to the AI provider. It does not send passwords, API keys, full database dumps, hidden configuration, or unrelated private records.

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

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Database setup

Start PostgreSQL locally, set `DATABASE_URL`, then run:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

The initial schema includes `users`, `accounts`, `sessions`, `verification_tokens`, `profiles`, `goals`, `tasks`, `memories`, `conversations`, and `messages`. Memory rows include metadata fields reserved for a future semantic/vector memory migration.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Current limitations and future work

LumaOS does not yet include autonomous agents, tool execution, external tool integrations, calendar/email integrations, vector embeddings, semantic memory retrieval, automatic memory extraction, document ingestion, billing, plugins, marketplace functionality, distributed rate limiting, or advanced permissions. These are future phases, not Phase 3 features.
