"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { goals, profiles, tasks, users } from "@/db/schema";
import { goalSchema, memorySchema, memoryFilterSchema, memorySuggestionSchema, onboardingSchema, profileSchema, registerSchema, taskSchema } from "@/lib/validation/core";
import { createMemory, deleteMemory, updateMemory } from "@/server/services/memory";
import { UnauthorizedError, toActionError } from "@/server/errors";
import { ensureGoal } from "@/server/repositories/core";

async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

export async function registerAction(formData: FormData) {
  try {
    const input = registerSchema.parse(Object.fromEntries(formData));
    const email = input.email.toLowerCase();
    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) redirect("/register?error=credentials");

    const hash = await bcrypt.hash(input.password, 12);
    await db.insert(users).values({ name: input.name, email, passwordHash: hash });
    await signIn("credentials", { email, password: input.password, redirect: false });
  } catch (error) {
    console.error("Registration failed", { error: toActionError(error) });
    redirect("/register?error=credentials");
  }

  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });
  } catch {
    redirect("/login?error=credentials");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await signOut({ callbackUrl: "/login" });
}

export async function onboardingAction(formData: FormData) {
  const id = await userId();
  const input = onboardingSchema.parse(Object.fromEntries(formData));
  await db
    .insert(profiles)
    .values({
      userId: id,
      displayName: input.name,
      primaryGoal: input.primaryGoal,
      about: input.about || null,
      onboardingCompletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: input.name,
        primaryGoal: input.primaryGoal,
        about: input.about || null,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  await db.insert(goals).values({ userId: id, title: input.primaryGoal, description: input.about || null });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProfileAction(formData: FormData) {
  const id = await userId();
  const input = profileSchema.parse(Object.fromEntries(formData));
  await db
    .insert(profiles)
    .values({ userId: id, displayName: input.displayName, primaryGoal: input.primaryGoal || null, about: input.about || null, onboardingCompletedAt: input.onboardingCompleted ? new Date() : null })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { displayName: input.displayName, primaryGoal: input.primaryGoal || null, about: input.about || null, onboardingCompletedAt: input.onboardingCompleted ? new Date() : null, updatedAt: new Date() },
    });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function createGoalAction(formData: FormData) {
  const id = await userId();
  const input = goalSchema.parse(Object.fromEntries(formData));
  await db.insert(goals).values({ userId: id, title: input.title, description: input.description || null });
  revalidatePath("/tasks");
}

export async function archiveGoalAction(goalId: string) {
  const id = await userId();
  await ensureGoal(id, goalId);
  await db.update(goals).set({ archived: true, updatedAt: new Date() }).where(and(eq(goals.id, goalId), eq(goals.userId, id)));
  revalidatePath("/tasks");
}

export async function createTaskAction(formData: FormData) {
  const id = await userId();
  const input = taskSchema.parse(Object.fromEntries(formData));
  if (input.goalId) await ensureGoal(id, input.goalId);
  await db.insert(tasks).values({ userId: id, title: input.title, notes: input.notes || null, goalId: input.goalId || null });
  revalidatePath("/tasks");
}

export async function completeTaskAction(taskId: string) {
  const id = await userId();
  await db.update(tasks).set({ status: "DONE", updatedAt: new Date() }).where(and(eq(tasks.id, taskId), eq(tasks.userId, id)));
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTaskAction(taskId: string) {
  const id = await userId();
  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, id)));
  revalidatePath("/tasks");
}

export async function upsertMemoryAction(formData: FormData) {
  const id = await userId();
  const input = memorySchema.parse(Object.fromEntries(formData));
  const memoryId = String(formData.get("id") || "");

  const uiMemory = { ...input, source: "USER" as const };

  if (memoryId) {
    await updateMemory(id, memoryId, uiMemory);
  } else {
    await createMemory(id, uiMemory);
  }

  revalidatePath("/memory");
}

export async function acceptMemorySuggestionAction(formData: FormData) {
  const id = await userId();
  const input = memorySuggestionSchema.parse(Object.fromEntries(formData));
  await createMemory(id, { type: input.type, content: input.content, importance: 3, source: "USER" });
  revalidatePath("/memory");
  revalidatePath("/assistant");
}

export async function rejectMemorySuggestionAction() {
  await userId();
  revalidatePath("/assistant");
}

export async function searchMemoryAction(formData: FormData) {
  const id = await userId();
  const input = memoryFilterSchema.parse(Object.fromEntries(formData));
  const { listMemories } = await import("@/server/repositories/core");
  return { memories: await listMemories(id, { query: input.query || undefined, type: input.type || undefined }) };
}

export async function deleteMemoryAction(memoryId: string) {
  const id = await userId();
  await deleteMemory(id, memoryId);
  revalidatePath("/memory");
}

export async function sendAssistantMessageAction(payload: unknown) {
  try {
    const id = await userId();
    const { generateAssistantResponse } = await import("@/server/services/ai");
    const input = payload as { message?: string; conversationId?: string };
    return await generateAssistantResponse({ userId: id, message: input.message ?? "", conversationId: input.conversationId });
  } catch (error) {
    return { error: toActionError(error) };
  }
}

export async function getAssistantConversationAction(conversationId: string) {
  try {
    const id = await userId();
    const { getConversationMessages } = await import("@/server/repositories/conversations");
    return { messages: await getConversationMessages(id, conversationId) };
  } catch (error) {
    return { error: toActionError(error) };
  }
}

export async function listAssistantConversationsAction() {
  try {
    const id = await userId();
    const { listUserConversations } = await import("@/server/repositories/conversations");
    return { conversations: await listUserConversations(id) };
  } catch (error) {
    return { error: toActionError(error) };
  }
}
