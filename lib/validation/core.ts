import { z } from "zod";
export const registerSchema = z.object({ name: z.string().min(1).max(120), email: z.string().email(), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const onboardingSchema = z.object({ name: z.string().min(1).max(120), primaryGoal: z.string().min(3).max(180), about: z.string().max(1000).optional().or(z.literal("")) });
export const goalSchema = z.object({ title: z.string().min(3).max(180), description: z.string().max(2000).optional().or(z.literal("")) });
export const taskSchema = z.object({ title: z.string().min(3).max(180), notes: z.string().max(2000).optional().or(z.literal("")), goalId: z.string().uuid().optional().or(z.literal("")) });
export const memorySchema = z.object({ type: z.enum(["PROFILE", "PREFERENCE", "GOAL", "FACT", "KNOWLEDGE", "PROJECT"]), content: z.string().min(3).max(4000), importance: z.coerce.number().int().min(1).max(5), source: z.string().min(1).max(120).default("manual") });
export function assertOwnsResource(resourceUserId: string, sessionUserId: string) { return resourceUserId === sessionUserId; }
