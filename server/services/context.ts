import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, profiles, tasks } from "@/db/schema";
import { getRelevantMemories } from "@/server/services/memory";

export const contextLimits = { profile: 1, activeGoals: 5, openTasks: 10, relevantMemories: 8 } as const;

export async function buildUserContext({ userId, query = "" }: { userId: string; query?: string }) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(contextLimits.profile);
  const activeGoals = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.archived, false))).orderBy(desc(goals.updatedAt)).limit(contextLimits.activeGoals);
  const openTasks = await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "TODO"))).orderBy(desc(tasks.updatedAt)).limit(contextLimits.openTasks);
  const relevantMemories = await getRelevantMemories({ userId, query, limit: contextLimits.relevantMemories });
  return { profile: profile ?? null, activeGoals, openTasks, memories: relevantMemories, limits: contextLimits };
}
