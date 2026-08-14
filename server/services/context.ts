import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, profiles, tasks } from "@/db/schema";
import { getRelevantMemories } from "@/server/services/memory";

export const AI_CONTEXT_LIMITS = {
  relevantMemories: 6,
  activeGoals: 5,
  openTasks: 8,
  profileChars: 800,
  memoryChars: 700,
  goalChars: 500,
  taskChars: 400,
} as const;

export type LumaAIContext = {
  profile: { displayName?: string; primaryGoal?: string; about?: string } | null;
  relevantMemories: Array<{ type: string; content: string; importance: number }>;
  activeGoals: Array<{ title: string; description?: string }>;
  openTasks: Array<{ title: string; notes?: string; dueDate?: string }>;
};

function truncate(value: string | null | undefined, max: number) {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function queryTerms(query: string) {
  return query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 3).slice(0, 8);
}

function memoryScore(content: string, query: string, importance: number) {
  const lower = content.toLowerCase();
  const matches = queryTerms(query).filter((term) => lower.includes(term)).length;
  return matches * 10 + importance;
}

export async function buildUserContext(userId: string, query: string): Promise<LumaAIContext> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const activeGoals = await db
    .select({ title: goals.title, description: goals.description })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.archived, false)))
    .orderBy(desc(goals.updatedAt))
    .limit(AI_CONTEXT_LIMITS.activeGoals);
  const openTasks = await db
    .select({ title: tasks.title, notes: tasks.notes, dueDate: tasks.dueDate })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.status, "TODO")))
    .orderBy(desc(tasks.updatedAt))
    .limit(AI_CONTEXT_LIMITS.openTasks);
  const memoryPool = await getRelevantMemories(userId, query, AI_CONTEXT_LIMITS.relevantMemories);

  const relevantMemories = memoryPool
    .map((memory) => ({ ...memory, score: memoryScore(memory.content, query, memory.importance) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_CONTEXT_LIMITS.relevantMemories)
    .map((memory) => ({
      type: memory.type,
      content: truncate(memory.content, AI_CONTEXT_LIMITS.memoryChars) ?? "",
      importance: memory.importance,
    }));

  return {
    profile: profile
      ? {
          displayName: truncate(profile.displayName, 120),
          primaryGoal: truncate(profile.primaryGoal, AI_CONTEXT_LIMITS.profileChars),
          about: truncate(profile.about, AI_CONTEXT_LIMITS.profileChars),
        }
      : null,
    relevantMemories,
    activeGoals: activeGoals.map((goal) => ({ title: truncate(goal.title, 180) ?? "", description: truncate(goal.description, AI_CONTEXT_LIMITS.goalChars) })),
    openTasks: openTasks.map((task) => ({ title: truncate(task.title, 180) ?? "", notes: truncate(task.notes, AI_CONTEXT_LIMITS.taskChars), dueDate: task.dueDate?.toISOString() })),
  };
}
