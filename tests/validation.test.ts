import { describe, expect, it } from "vitest";
import { assertOwnsResource, goalSchema, memorySchema, memorySearchSchema, taskSchema } from "@/lib/validation/core";

describe("validation schemas", () => {
  it("accepts a valid goal", () => { expect(goalSchema.parse({ title: "Launch foundation" }).title).toBe("Launch foundation"); });
  it("rejects short goal titles", () => { expect(() => goalSchema.parse({ title: "go" })).toThrow(); });
  it("validates task goal ids when present", () => { expect(() => taskSchema.parse({ title: "Write docs", goalId: "not-a-uuid" })).toThrow(); });
});

describe("memory validation", () => {
  it("accepts a valid memory", () => { const memory = memorySchema.parse({ type: "FACT", content: "User prefers concise summaries", importance: 4, source: "USER" }); expect(memory.type).toBe("FACT"); });
  it("trims content", () => { expect(memorySchema.parse({ type: "KNOWLEDGE", content: "  retain this  ", importance: 3, source: "USER" }).content).toBe("retain this"); });
  it("rejects empty content", () => { expect(() => memorySchema.parse({ type: "FACT", content: "   ", importance: 3, source: "USER" })).toThrow(); });
  it("rejects overly long content", () => { expect(() => memorySchema.parse({ type: "FACT", content: "x".repeat(4001), importance: 3, source: "USER" })).toThrow(); });
  it("rejects invalid type", () => { expect(() => memorySchema.parse({ type: "MOOD", content: "abc", importance: 3, source: "USER" })).toThrow(); });
  it("rejects invalid importance", () => { expect(() => memorySchema.parse({ type: "FACT", content: "abc", importance: 9, source: "USER" })).toThrow(); });
  it("rejects invalid source", () => { expect(() => memorySchema.parse({ type: "FACT", content: "abc", importance: 3, source: "manual" })).toThrow(); });
});

describe("ownership checks", () => {
  it("allows matching user ids only", () => { expect(assertOwnsResource("user_1", "user_1")).toBe(true); expect(assertOwnsResource("user_1", "user_2")).toBe(false); });
  it("treats another user's memory as inaccessible", () => { expect(assertOwnsResource("owner", "intruder")).toBe(false); });
});

describe("memory search validation", () => {
  it("allows empty query safely", () => { expect(memorySearchSchema.parse({ query: "" }).query).toBe(""); });
  it("bounds search limits", () => { expect(() => memorySearchSchema.parse({ limit: 500 })).toThrow(); });
  it("supports type filters", () => { expect(memorySearchSchema.parse({ type: "PROJECT", query: "luma" }).type).toBe("PROJECT"); });
});
