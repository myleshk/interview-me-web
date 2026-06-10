"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IdentityHeader } from "@/components/IdentityHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { streamChat, type ChatMessage as ChatMessageType } from "@/lib/api";

let _msgId = 0;

interface UIMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages — use auto (not smooth) to avoid
  // jitter during rapid token streaming.
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    // Guard: ignore if already streaming
    if (streamingRef.current) return;

    // Cancel any in-flight stream (e.g. previous send leaked)
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: UIMessage = {
      id: ++_msgId,
      role: "user",
      content,
    };
    const assistantPlaceholder: UIMessage = {
      id: ++_msgId,
      role: "assistant",
      content: "",
    };

    streamingRef.current = true;
    setStreaming(true);
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

    const conversation: ChatMessageType[] = [
      ...messages,
      { role: "user" as const, content },
    ];

    try {
      const stream = streamChat(conversation, controller.signal);
      let accumulated = "";
      for await (const token of stream) {
        accumulated += token;
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.id === assistantPlaceholder.id);
          if (idx !== -1) {
            next[idx] = { ...next[idx], content: accumulated };
          }
          return next;
        });
      }
    } catch (err) {
      if (controller.signal.aborted) return; // intentional cancel, no error UI
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.id === assistantPlaceholder.id);
        if (idx !== -1) {
          next[idx] = {
            ...next[idx],
            content: `Sorry, I couldn't process that. ${message}`,
          };
        }
        return next;
      });
    } finally {
      streamingRef.current = false;
      setStreaming(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <IdentityHeader />

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-2xl">💬</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Chat with an AI interview avatar
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Ask about skills, experience, projects, and more. The AI is
              grounded in real professional data — no hallucination.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        disabled={streaming}
      />
    </div>
  );
}
