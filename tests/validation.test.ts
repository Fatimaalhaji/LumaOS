import { describe, expect, it } from "vitest";
import { assertOwnsResource, goalSchema, memorySchema, memorySearchSchema, taskSchema } from "@/lib/validation/core";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const goalA = "33333333-3333-4333-8333-333333333333";

function canAttachTaskToGoal(taskUserId: string, goalUserId: string) {
  return assertOwnsResource(goalUserId, taskUserId);
}

describe("goal validation", () => {
  it("accepts valid goal input", () => {
    expect(goalSchema.parse({ title: " Launch foundation ", description: " Ship Phase 1 " })).toEqual({
      title: "Launch foundation",
      description: "Ship Phase 1",
    });
  });

  it("rejects invalid goal input", () => {
    expect(() => goalSchema.parse({ title: "go" })).toThrow();
    expect(() => goalSchema.parse({ title: "x".repeat(181) })).toThrow();
  });
});

describe("task validation", () => {
  it("accepts valid task input", () => {
    expect(taskSchema.parse({ title: "Write docs", notes: "Keep it concise", goalId: goalA })).toEqual({
      title: "Write docs",
      notes: "Keep it concise",
      goalId: goalA,
    });
  });

  it("rejects invalid task input", () => {
    expect(() => taskSchema.parse({ title: "no", goalId: goalA })).toThrow();
    expect(() => taskSchema.parse({ title: "Write docs", goalId: "not-a-uuid" })).toThrow();
  });
});

describe("memory validation", () => {
  it("accepts valid memory input and trims content", () => {
    const memory = memorySchema.parse({ type: "FACT", content: " User prefers concise summaries ", importance: "4", source: "USER" });
    expect(memory).toEqual({ type: "FACT", content: "User prefers concise summaries", importance: 4, source: "USER" });
  });

  it("defaults controlled source to USER", () => {
    expect(memorySchema.parse({ type: "PREFERENCE", content: "Likes morning planning", importance: 3 }).source).toBe("USER");
  });

  it("accepts controlled memory types and sources", () => {
    expect(memorySchema.parse({ type: "PROFILE", content: "Name is Avery", importance: 1, source: "SYSTEM" }).type).toBe("PROFILE");
    expect(memorySchema.parse({ type: "PROJECT", content: "Working on LumaOS", importance: 5, source: "IMPORT" }).source).toBe("IMPORT");
  });

  it("rejects invalid memory input", () => {
    expect(() => memorySchema.parse({ type: "UNKNOWN", content: "abc", importance: 3, source: "USER" })).toThrow();
    expect(() => memorySchema.parse({ type: "FACT", content: "ab", importance: 3, source: "USER" })).toThrow();
    expect(() => memorySchema.parse({ type: "FACT", content: "abc", importance: 9, source: "USER" })).toThrow();
    expect(() => memorySchema.parse({ type: "FACT", content: "abc", importance: 3, source: "manual" })).toThrow();
    expect(() => memorySchema.parse({ type: "FACT", content: "a".repeat(4001), importance: 3, source: "USER" })).toThrow();
  });

  it("validates lexical memory search", () => {
    expect(memorySearchSchema.parse({ query: " biology exam ", limit: "6" })).toEqual({ query: "biology exam", limit: 6 });
    expect(() => memorySearchSchema.parse({ query: "", limit: 5 })).toThrow();
    expect(() => memorySearchSchema.parse({ query: "biology", limit: 51 })).toThrow();
  });
});

describe("ownership validation", () => {
  it("accepts resources owned by the authenticated user", () => {
    expect(assertOwnsResource(userA, userA)).toBe(true);
  });

  it("rejects cross-user resources", () => {
    expect(assertOwnsResource(userB, userA)).toBe(false);
  });

  it("rejects cross-user task to goal relationships", () => {
    expect(canAttachTaskToGoal(userA, userA)).toBe(true);
    expect(canAttachTaskToGoal(userA, userB)).toBe(false);
  });
});
