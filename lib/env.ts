import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://postgres:postgres@localhost:5432/lumaos"),
  AUTH_SECRET: z.string().min(1).default("development-secret-change-me"),
  AUTH_TRUST_HOST: z.string().optional(),
  AI_PROVIDER: z.string().optional(),
  AI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
