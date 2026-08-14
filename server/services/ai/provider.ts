import OpenAI from "openai";
import { getAIConfig } from "@/server/services/ai/config";

export type AIProviderMessage = { role: "system" | "user" | "assistant"; content: string };
export type AIProviderRequest = { messages: AIProviderMessage[] };
export type AIProviderResponse = { content: string };

export interface AIProvider {
  generate(request: AIProviderRequest): Promise<AIProviderResponse>;
}

export class AIProviderError extends Error {
  constructor(public code: "missing_api_key" | "provider_unavailable" | "rate_limited" | "timeout" | "invalid_config" | "empty_response", message = code) {
    super(message);
  }
}

export class OpenAIProvider implements AIProvider {
  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    const config = getAIConfig();
    if (!config.apiKey) throw new AIProviderError("missing_api_key");

    try {
      const client = new OpenAI({ apiKey: config.apiKey });
      const response = await client.chat.completions.create({
        model: config.model,
        messages: request.messages,
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
      });
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new AIProviderError("empty_response");
      return { content };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
      if (status === 429) throw new AIProviderError("rate_limited");
      if (status === 408) throw new AIProviderError("timeout");
      if (status && status >= 400 && status < 500) throw new AIProviderError("invalid_config");
      throw new AIProviderError("provider_unavailable");
    }
  }
}

export function createAIProvider(): AIProvider {
  const config = getAIConfig();
  if (config.provider === "openai") return new OpenAIProvider();
  throw new AIProviderError("invalid_config");
}
