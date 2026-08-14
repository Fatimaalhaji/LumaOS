import { describe, expect, it, vi } from "vitest";
import { assistantMessageSchema } from "@/lib/validation/ai";
import { AI_CONTEXT_LIMITS } from "@/server/services/context";
import { AIProviderError } from "@/server/services/ai/provider";
import { buildPromptMessages, generateAssistantResponse } from "@/server/services/ai";

vi.mock("@/server/repositories/conversations", () => ({
  createConversation: vi.fn(async () => ({ id: "00000000-0000-4000-8000-000000000001", title: "New", createdAt: new Date(), updatedAt: new Date() })),
  getUserConversation: vi.fn(async (_userId: string, conversationId: string) => ({ id: conversationId, title: "Existing", createdAt: new Date(), updatedAt: new Date() })),
  getRecentMessages: vi.fn(async () => []),
  appendMessage: vi.fn(async (_conversationId: string, role: string, content: string) => ({ id: crypto.randomUUID(), role, content, createdAt: new Date() })),
}));

vi.mock("@/server/services/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/services/context")>();
  return {
    ...actual,
    buildUserContext: vi.fn(async () => ({
      profile: { displayName: "Avery", primaryGoal: "Become a nurse", about: "Prefers simple explanations" },
      relevantMemories: [{ type: "PREFERENCE", content: "Prefers simple explanations", importance: 5 }],
      activeGoals: [{ title: "Become a nurse", description: "Prepare for nursing school" }],
      openTasks: [{ title: "Study biology", notes: "Review cells" }],
    })),
  };
});

describe("assistant validation", () => {
  it("rejects empty messages", () => {
    expect(() => assistantMessageSchema.parse({ message: "   " })).toThrow();
  });

  it("rejects oversized messages", () => {
    expect(() => assistantMessageSchema.parse({ message: "a".repeat(4001) })).toThrow();
  });
});

describe("context prompt construction", () => {
  it("includes bounded relevant context without internal ids", () => {
    const messages = buildPromptMessages({
      message: "Help me study today.",
      recentMessages: [],
      context: {
        profile: { displayName: "Avery", primaryGoal: "Become a nurse" },
        relevantMemories: [{ type: "PREFERENCE", content: "Prefers simple explanations", importance: 5 }],
        activeGoals: [{ title: "Become a nurse" }],
        openTasks: [{ title: "Study biology" }],
      },
    });
    const context = messages[1].content;
    expect(context).toContain("Prefers simple explanations");
    expect(context).toContain("Become a nurse");
    expect(context).toContain("Study biology");
    expect(context).not.toContain("userId");
    expect(context).not.toContain("password");
  });

  it("documents hard limits for bounded context", () => {
    expect(AI_CONTEXT_LIMITS.relevantMemories).toBeLessThanOrEqual(6);
    expect(AI_CONTEXT_LIMITS.openTasks).toBeLessThanOrEqual(8);
  });
});

describe("ai service", () => {
  it("returns successful provider responses", async () => {
    const provider = { generate: vi.fn(async () => ({ content: "Study biology first, then review your goal." })) };
    const result = await generateAssistantResponse({ userId: crypto.randomUUID(), message: "Help me study today.", provider });
    expect(result.error).toBeUndefined();
    expect(result.message?.content).toContain("Study biology");
    expect(provider.generate).toHaveBeenCalledOnce();
  });

  it("normalizes provider errors", async () => {
    const provider = { generate: vi.fn(async () => { throw new AIProviderError("provider_unavailable"); }) };
    const result = await generateAssistantResponse({ userId: crypto.randomUUID(), message: "Hi", provider });
    expect(result.error).toBe("The assistant is temporarily unavailable. Please try again later.");
  });

  it("normalizes empty provider responses", async () => {
    const provider = { generate: vi.fn(async () => ({ content: "   " })) };
    const result = await generateAssistantResponse({ userId: crypto.randomUUID(), message: "Hi", provider });
    expect(result.error).toBe("The assistant returned an empty response. Please try again.");
  });
});
