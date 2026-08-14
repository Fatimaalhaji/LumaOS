import { asc, and, desc, eq } from "drizzle-orm";
import { conversations, messages } from "@/db/schema";
import { db } from "@/lib/db";
import { NotFoundError } from "@/server/errors";

export const RECENT_MESSAGE_LIMIT = 12;

export async function createConversation(userId: string, title = "New conversation") {
  const [conversation] = await db.insert(conversations).values({ userId, title }).returning();
  return conversation;
}

export async function getUserConversation(userId: string, conversationId: string) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);
  if (!conversation) throw new NotFoundError();
  return conversation;
}

export async function listUserConversations(userId: string) {
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt)).limit(30);
}

export async function appendMessage(conversationId: string, role: "USER" | "ASSISTANT", content: string) {
  const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  return message;
}

export async function getRecentMessages(userId: string, conversationId: string, limit = RECENT_MESSAGE_LIMIT) {
  await getUserConversation(userId, conversationId);
  const rows = await db
    .select({ id: messages.id, role: messages.role, content: messages.content, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

export async function getConversationMessages(userId: string, conversationId: string) {
  await getUserConversation(userId, conversationId);
  return db
    .select({ id: messages.id, role: messages.role, content: messages.content, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(100);
}
