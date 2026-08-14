import { describe, expect, it } from "vitest";
import { assertOwnsResource, goalSchema, memorySchema, taskSchema } from "@/lib/validation/core";

describe("validation schemas", () => {
  it("accepts a valid goal", () => { expect(goalSchema.parse({ title: "Launch foundation" }).title).toBe("Launch foundation"); });
  it("rejects short goal titles", () => { expect(() => goalSchema.parse({ title: "go" })).toThrow(); });
  it("validates task goal ids when present", () => { expect(() => taskSchema.parse({ title: "Write docs", goalId: "not-a-uuid" })).toThrow(); });
  it("validates memory type and importance", () => { const memory = memorySchema.parse({ type: "FACT", content: "User prefers concise summaries", importance: 4, source: "manual" }); expect(memory.type).toBe("FACT"); });
  it("rejects memory importance outside range", () => { expect(() => memorySchema.parse({ type: "FACT", content: "abc", importance: 9, source: "manual" })).toThrow(); });
});

describe("ownership checks", () => {
  it("allows matching user ids only", () => { expect(assertOwnsResource("user_1", "user_1")).toBe(true); expect(assertOwnsResource("user_1", "user_2")).toBe(false); });
});
