import { and, desc, eq } from "drizzle-orm";
import { memories } from "@/db/schema";
import { db } from "@/lib/db";
import { memorySchema, memorySearchSchema, type MemoryInput } from "@/lib/validation/core";

export const MEMORY_RELEVANCE_LIMIT = 6;
export const MEMORY_SEARCH_LIMIT = 50;
export const MEMORY_POOL_LIMIT = 100;

export type MemorySource = "USER" | "ASSISTANT" | "IMPORT" | "SYSTEM";

export function normalizeMemorySource(source: string | undefined): MemorySource {
  if (source === "ASSISTANT" || source === "IMPORT" || source === "SYSTEM") return source;
  return "USER";
}

function queryTerms(query: string) {
  return query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 3).slice(0, 8);
}

export function scoreMemory(content: string, query: string, importance: number) {
  const lower = content.toLowerCase();
  const matches = queryTerms(query).filter((term) => lower.includes(term)).length;
  return matches * 10 + importance;
}

export async function listUserMemories(userId: string) {
  return db.select().from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.updatedAt));
}

export async function createMemory(userId: string, input: MemoryInput) {
  const parsed = memorySchema.parse(input);
  const [memory] = await db.insert(memories).values({ userId, ...parsed }).returning();
  return memory;
}

export async function updateMemory(userId: string, memoryId: string, input: MemoryInput) {
  const parsed = memorySchema.parse(input);
  const [memory] = await db.update(memories).set({ ...parsed, updatedAt: new Date() }).where(and(eq(memories.id, memoryId), eq(memories.userId, userId))).returning();
  return memory;
}

export async function deleteMemory(userId: string, memoryId: string) {
  await db.delete(memories).where(and(eq(memories.id, memoryId), eq(memories.userId, userId)));
}

export async function searchMemories(userId: string, query: string, limit = MEMORY_SEARCH_LIMIT) {
  const parsed = memorySearchSchema.parse({ query, limit });
  const pool = await db.select().from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.importance), desc(memories.updatedAt)).limit(MEMORY_POOL_LIMIT);
  return pool
    .map((memory) => ({ ...memory, score: scoreMemory(memory.content, parsed.query, memory.importance) }))
    .filter((memory) => memory.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, parsed.limit);
}

export async function getRelevantMemories(userId: string, query: string, limit = MEMORY_RELEVANCE_LIMIT) {
  return searchMemories(userId, query, limit);
}
