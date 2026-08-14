"use client";

import { useEffect, useState, useTransition } from "react";
import { getAssistantConversationAction, listAssistantConversationsAction, sendAssistantMessageAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Conversation = { id: string; title: string; updatedAt: Date };
type ChatMessage = { id?: string; role: "USER" | "ASSISTANT"; content: string; createdAt?: Date };

export function AssistantClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await listAssistantConversationsAction();
      if ("conversations" in result) setConversations(result.conversations as Conversation[]);
    });
  }, []);

  function openConversation(id: string) {
    setConversationId(id);
    setError(undefined);
    startTransition(async () => {
      const result = await getAssistantConversationAction(id);
      if ("messages" in result) setMessages(result.messages as ChatMessage[]);
      else setError(result.error);
    });
  }

  function newConversation() {
    setConversationId(undefined);
    setMessages([]);
    setError(undefined);
  }

  function send() {
    const text = message.trim();
    if (!text || isPending) return;
    setMessage("");
    setError(undefined);
    setMessages((current: ChatMessage[]) => [...current, { role: "USER", content: text }]);
    startTransition(async () => {
      const result = await sendAssistantMessageAction({ message: text, conversationId }) as { error?: string; conversationId?: string; message?: ChatMessage };
      if (result.error || !result.message || !result.conversationId) {
        setError(result.error ?? "The assistant returned an invalid response.");
        return;
      }
      const assistantMessage = result.message;
      setConversationId(result.conversationId);
      setMessages((current: ChatMessage[]) => [...current, assistantMessage]);
      const list = await listAssistantConversationsAction();
      if ("conversations" in list) setConversations(list.conversations as Conversation[]);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="card h-fit">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Conversations</h2><Button type="button" onClick={newConversation}>New</Button></div>
        <div className="mt-4 space-y-2">
          {conversations.length === 0 ? <p className="text-sm text-slate-400">No conversations yet.</p> : conversations.map((conversation: Conversation) => (
            <button key={conversation.id} onClick={() => openConversation(conversation.id)} className={`w-full rounded-xl border p-3 text-left text-sm ${conversation.id === conversationId ? "border-violet-400 bg-violet-500/10" : "border-slate-700 bg-slate-900/40"}`}>{conversation.title}</button>
          ))}
        </div>
      </aside>
      <section className="card flex min-h-[620px] flex-col">
        <p className="text-sm uppercase tracking-widest text-violet-300">AI Assistant</p>
        <h1 className="mt-2 text-4xl font-bold">LumaOS Intelligence</h1>
        <div className="mt-6 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          {messages.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Ask LumaOS for help planning, studying, or thinking through your goals using your saved context.</div> : messages.map((item: ChatMessage, index: number) => (
            <div key={item.id ?? index} className={`max-w-[85%] rounded-2xl p-4 ${item.role === "USER" ? "ml-auto bg-violet-600 text-white" : "bg-slate-800 text-slate-100"}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-70">{item.role === "USER" ? "You" : "LumaOS"}</p><p className="mt-2 whitespace-pre-wrap">{item.content}</p></div>
          ))}
          {isPending ? <p className="text-sm text-violet-300">LumaOS is thinking…</p> : null}
        </div>
        {error ? <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
        <div className="mt-4 flex gap-3"><Input value={message} onChange={(event: { target: { value: string } }) => setMessage(event.target.value)} onKeyDown={(event: { key: string }) => { if (event.key === "Enter") send(); }} placeholder="Ask LumaOS…" disabled={isPending} /><Button type="button" onClick={send} disabled={isPending || !message.trim()}>Send</Button></div>
      </section>
    </div>
  );
}
