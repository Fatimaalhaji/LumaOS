import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { memories } from "@/db/schema";
import { NotFoundError } from "@/server/errors";
import { createMemorySchema, memorySearchSchema, updateMemorySchema } from "@/lib/validation/core";
import type { z } from "zod";

type CreateMemoryInput = z.input<typeof createMemorySchema>;
type UpdateMemoryInput = z.input<typeof updateMemorySchema>;
type SearchMemoryInput = z.input<typeof memorySearchSchema>;

export type MemoryRecord = typeof memories.$inferSelect;

export async function createMemory(userId: string, input: CreateMemoryInput) {
  const parsed = createMemorySchema.parse(input);
  const [memory] = await db.insert(memories).values({ userId, ...parsed }).returning();
  return memory;
}

export async function getMemory(userId: string, memoryId: string) {
  const [memory] = await db.select().from(memories).where(and(eq(memories.id, memoryId), eq(memories.userId, userId))).limit(1);
  if (!memory) throw new NotFoundError();
  return memory;
}

export async function listMemories(userId: string, input: SearchMemoryInput = {}) {
  const parsed = memorySearchSchema.parse(input);
  const conditions = [eq(memories.userId, userId)];
  if (parsed.type) conditions.push(eq(memories.type, parsed.type));
  if (parsed.query) conditions.push(ilike(memories.content, `%${parsed.query}%`));
  return db.select().from(memories).where(and(...conditions)).orderBy(desc(memories.updatedAt)).limit(parsed.limit);
}

export async function updateMemory(userId: string, memoryId: string, input: UpdateMemoryInput) {
  const parsed = updateMemorySchema.parse(input);
  const [memory] = await db.update(memories).set({ ...parsed, updatedAt: new Date() }).where(and(eq(memories.id, memoryId), eq(memories.userId, userId))).returning();
  if (!memory) throw new NotFoundError();
  return memory;
}

export async function deleteMemory(userId: string, memoryId: string) {
  const [memory] = await db.delete(memories).where(and(eq(memories.id, memoryId), eq(memories.userId, userId))).returning({ id: memories.id });
  if (!memory) throw new NotFoundError();
  return memory;
}

export async function searchMemories(userId: string, input: SearchMemoryInput) {
  return listMemories(userId, input);
}

export async function getRelevantMemories({ userId, query = "", limit = 8 }: { userId: string; query?: string; limit?: number }) {
  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const normalizedQuery = query.trim();
  const where = normalizedQuery
    ? and(eq(memories.userId, userId), ilike(memories.content, `%${normalizedQuery}%`))
    : eq(memories.userId, userId);

  // Temporary lexical relevance: partial keyword match first, then importance and recency.
  return db.select().from(memories).where(where).orderBy(desc(memories.importance), desc(memories.updatedAt)).limit(safeLimit);
}
