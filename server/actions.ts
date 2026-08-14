"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { goals, memories, profiles, tasks, users } from "@/db/schema";
import { goalSchema, memorySchema, onboardingSchema, registerSchema, taskSchema } from "@/lib/validation/core";
import { UnauthorizedError, toActionError } from "@/server/errors";
import { ensureGoal } from "@/server/repositories/core";

async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

export async function registerAction(_: unknown, formData: FormData) {
  try {
    const input = registerSchema.parse(Object.fromEntries(formData));
    const email = input.email.toLowerCase();
    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) return { error: "Unable to register with those credentials." };

    const hash = await bcrypt.hash(input.password, 12);
    await db.insert(users).values({ name: input.name, email, passwordHash: hash });
    await signIn("credentials", { email, password: input.password, redirect: false });
  } catch (error) {
    return { error: toActionError(error) };
  }

  redirect("/onboarding");
}

export async function loginAction(_: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });
  } catch {
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function onboardingAction(_: unknown, formData: FormData) {
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

  if (memoryId) {
    await db.update(memories).set({ ...input, updatedAt: new Date() }).where(and(eq(memories.id, memoryId), eq(memories.userId, id)));
  } else {
    await db.insert(memories).values({ userId: id, ...input });
  }

  revalidatePath("/memory");
}

export async function deleteMemoryAction(memoryId: string) {
  const id = await userId();
  await db.delete(memories).where(and(eq(memories.id, memoryId), eq(memories.userId, id)));
  revalidatePath("/memory");
}
