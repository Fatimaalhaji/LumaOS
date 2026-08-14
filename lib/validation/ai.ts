import { z } from "zod";

export const ASSISTANT_MESSAGE_MAX_LENGTH = 4000;

export const conversationIdSchema = z.string().uuid();

export const assistantMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(ASSISTANT_MESSAGE_MAX_LENGTH, "Message is too long."),
  conversationId: conversationIdSchema.optional(),
});

export const aiConfigSchema = z.object({
  provider: z.enum(["openai"]).default("openai"),
  apiKey: z.string().min(1).optional(),
  model: z.string().trim().min(1).default("gpt-4o-mini"),
  maxOutputTokens: z.coerce.number().int().min(1).max(4096).default(700),
  temperature: z.coerce.number().min(0).max(2).default(0.4),
});
