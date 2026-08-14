import { z } from "zod";

export const memoryTypes = ["PROFILE", "PREFERENCE", "GOAL", "FACT", "KNOWLEDGE", "PROJECT"] as const;
export const memorySources = ["USER", "ASSISTANT", "IMPORT", "SYSTEM"] as const;

export const registerSchema = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email(), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(8) });
export const onboardingSchema = z.object({ name: z.string().trim().min(1).max(120), primaryGoal: z.string().trim().min(3).max(180), about: z.string().trim().max(1000).optional().or(z.literal("")) });
export const goalSchema = z.object({ title: z.string().trim().min(3).max(180), description: z.string().trim().max(2000).optional().or(z.literal("")) });
export const taskSchema = z.object({ title: z.string().trim().min(3).max(180), notes: z.string().trim().max(2000).optional().or(z.literal("")), goalId: z.string().uuid().optional().or(z.literal("")) });
export const memorySchema = z.object({ type: z.enum(memoryTypes), content: z.string().trim().min(3).max(4000), importance: z.coerce.number().int().min(1).max(5), source: z.enum(memorySources).default("USER") });
export const memorySearchSchema = z.object({ query: z.string().trim().min(1).max(500), limit: z.coerce.number().int().min(1).max(50).default(10) });

export type MemoryInput = z.input<typeof memorySchema>;
export function assertOwnsResource(resourceUserId: string, sessionUserId: string) { return resourceUserId === sessionUserId; }
