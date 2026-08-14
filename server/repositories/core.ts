import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, goals, memories, profiles, tasks } from "@/db/schema";
import { NotFoundError } from "@/server/errors";

export const DASHBOARD_LIMITS = { goals: 5, tasks: 8, memories: 5, conversations: 5 } as const;

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return profile;
}

export async function getDashboard(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const activeGoals = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.archived, false))).orderBy(desc(goals.updatedAt)).limit(DASHBOARD_LIMITS.goals);
  const openTasks = await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "TODO"))).orderBy(desc(tasks.updatedAt)).limit(DASHBOARD_LIMITS.tasks);
  const recentMemories = await db.select({ type: memories.type, content: memories.content, importance: memories.importance, source: memories.source, updatedAt: memories.updatedAt }).from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.importance), desc(memories.updatedAt)).limit(DASHBOARD_LIMITS.memories);
  const recentConversations = await db.select({ id: conversations.id, title: conversations.title, updatedAt: conversations.updatedAt }).from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt)).limit(DASHBOARD_LIMITS.conversations);
  const [memoryTotal] = await db.select({ value: count() }).from(memories).where(eq(memories.userId, userId));
  const [doneTotal] = await db.select({ value: count() }).from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "DONE")));
  return { profile, goals: activeGoals, tasks: openTasks, memories: recentMemories, conversations: recentConversations, memoryCount: memoryTotal?.value ?? 0, completedTaskCount: doneTotal?.value ?? 0 };
}

export async function listMemories(userId: string, options: { query?: string; type?: string; limit?: number } = {}) {
  const limit = Math.min(options.limit ?? 50, 50);
  const filters = [eq(memories.userId, userId)];
  if (options.type) filters.push(eq(memories.type, options.type as typeof memories.type.enumValues[number]));
  const rows = await db.select().from(memories).where(and(...filters)).orderBy(desc(memories.importance), desc(memories.updatedAt)).limit(limit);
  const query = options.query?.toLowerCase().trim();
  return query ? rows.filter((memory) => memory.content.toLowerCase().includes(query)) : rows;
}
export async function listGoals(userId: string) { return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.updatedAt)); }
export async function listTasks(userId: string) { return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.updatedAt)); }
export async function listGoalsWithOpenTaskCounts(userId: string) {
  return db.select({ id: goals.id, title: goals.title, description: goals.description, archived: goals.archived, updatedAt: goals.updatedAt, openTaskCount: sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'TODO')` }).from(goals).leftJoin(tasks, and(eq(tasks.goalId, goals.id), eq(tasks.userId, userId))).where(eq(goals.userId, userId)).groupBy(goals.id).orderBy(desc(goals.updatedAt));
}
export async function ensureGoal(userId: string, goalId: string) { const [goal] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId))).limit(1); if (!goal) throw new NotFoundError(); return goal; }
