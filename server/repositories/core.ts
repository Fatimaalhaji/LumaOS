import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, memories, profiles, tasks } from "@/db/schema";
import { NotFoundError } from "@/server/errors";

export async function getDashboard(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const activeGoals = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.archived, false))).orderBy(desc(goals.createdAt));
  const openTasks = await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "TODO"))).orderBy(desc(tasks.createdAt));
  const [memoryCountRow] = await db.select({ count: count(memories.id) }).from(memories).where(eq(memories.userId, userId));
  const [recentMemory] = await db.select({ id: memories.id, type: memories.type, updatedAt: memories.updatedAt }).from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.updatedAt)).limit(1);
  return { profile, goals: activeGoals, tasks: openTasks, memory: { count: Number(memoryCountRow?.count ?? 0), recent: recentMemory ?? null } };
}
export async function listGoals(userId: string) { return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.updatedAt)); }
export async function listTasks(userId: string) { return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.updatedAt)); }
export async function ensureGoal(userId: string, goalId: string) { const [goal] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId))).limit(1); if (!goal) throw new NotFoundError(); return goal; }
