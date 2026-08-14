import { env } from "@/lib/env";
import { aiConfigSchema } from "@/lib/validation/ai";

export function getAIConfig() {
  return aiConfigSchema.parse({
    provider: env.AI_PROVIDER || "openai",
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL || "gpt-4o-mini",
    maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS || 700,
    temperature: env.AI_TEMPERATURE || 0.4,
  });
}
