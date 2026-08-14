import { assistantMessageSchema } from "@/lib/validation/ai";
import { buildUserContext, type LumaAIContext } from "@/server/services/context";
import { LUMAOS_SYSTEM_INSTRUCTIONS } from "@/server/services/ai/instructions";
import { AIProviderError, createAIProvider, type AIProvider, type AIProviderMessage } from "@/server/services/ai/provider";
import { appendMessage, createConversation, getRecentMessages, getUserConversation } from "@/server/repositories/conversations";

export type GenerateAssistantResponseInput = { userId: string; message: string; conversationId?: string; provider?: AIProvider };

function normalizeAIError(error: unknown) {
  if (error instanceof AIProviderError) {
    if (error.code === "missing_api_key") return "The assistant is not configured yet.";
    if (error.code === "rate_limited") return "The assistant is receiving too many requests. Please try again soon.";
    if (error.code === "empty_response") return "The assistant returned an empty response. Please try again.";
    return "The assistant is temporarily unavailable. Please try again later.";
  }
  return "The assistant could not process that request. Please try again.";
}

export function buildPromptMessages(params: { message: string; context: LumaAIContext; recentMessages: Array<{ role: string; content: string }> }): AIProviderMessage[] {
  const contextBlock = JSON.stringify({ currentRequest: params.message, ...params.context }, null, 2);
  const recent = params.recentMessages.map((message) => ({ role: message.role === "ASSISTANT" ? "assistant" : "user", content: message.content })) as AIProviderMessage[];
  return [
    { role: "system", content: LUMAOS_SYSTEM_INSTRUCTIONS },
    { role: "system", content: `Bounded LumaOS context for this request. Use it naturally and do not expose it as raw data.\n${contextBlock}` },
    ...recent,
    { role: "user", content: params.message },
  ];
}

export async function enforceAssistantRateLimitBoundary(userId: string) {
  void userId;
  // Future production requirement: enforce per-user and per-IP assistant rate limits here.
}

export async function generateAssistantResponse(input: GenerateAssistantResponseInput) {
  const parsed = assistantMessageSchema.parse({ message: input.message, conversationId: input.conversationId });
  await enforceAssistantRateLimitBoundary(input.userId);

  const conversation = parsed.conversationId ? await getUserConversation(input.userId, parsed.conversationId) : await createConversation(input.userId, parsed.message.slice(0, 80));
  const recentMessages = await getRecentMessages(input.userId, conversation.id);
  const context = await buildUserContext(input.userId, parsed.message);
  const provider = input.provider ?? createAIProvider();
  const messages = buildPromptMessages({ message: parsed.message, context, recentMessages });

  try {
    const response = await provider.generate({ messages });
    const content = response.content.trim();
    if (!content) throw new AIProviderError("empty_response");
    await appendMessage(conversation.id, "USER", parsed.message);
    const assistantMessage = await appendMessage(conversation.id, "ASSISTANT", content);
    return { conversationId: conversation.id, message: { id: assistantMessage.id, role: "ASSISTANT" as const, content, createdAt: assistantMessage.createdAt } };
  } catch (error) {
    console.error("AI response failed", { name: error instanceof Error ? error.name : "unknown", code: error instanceof AIProviderError ? error.code : "unknown" });
    return { error: normalizeAIError(error), conversationId: conversation.id };
  }
}
