import { describe, expect, it } from "vitest";
import { UnauthorizedError } from "@/server/errors";
import { conversationIdSchema } from "@/lib/validation/ai";

describe("assistant authentication and ownership boundaries", () => {
  it("has an unauthenticated rejection error type for assistant requests", () => {
    expect(new UnauthorizedError().message).toBe("Unauthorized");
  });

  it("validates client supplied conversation ids before ownership checks", () => {
    expect(() => conversationIdSchema.parse("not-a-uuid")).toThrow();
    expect(conversationIdSchema.parse("00000000-0000-4000-8000-000000000001")).toBe("00000000-0000-4000-8000-000000000001");
  });
});
