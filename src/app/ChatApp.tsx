"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { IdentityHeader } from "@/components/IdentityHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import type { AppConfig } from "@/lib/config";

/** Extract plain text from a UIMessage's parts array. */
function messageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function ChatApp() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch("/config.json")
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => {
        // Fallback: empty config — identity & CV won't render
        setConfig({
          identity: { name: "", title: "", employer: "", location: "" },
          cvUrl: "",
        });
      });
  }, []);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/web-api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  // Wait for config.json before rendering the UI
  if (!config) {
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        <div className="h-16 border-b border-border animate-pulse" />
        <div className="flex-1" />
        <div className="h-[72px] border-t border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <IdentityHeader identity={config.identity} cvUrl={config.cvUrl} />

      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-2xl">💬</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Chat with an AI interview avatar
            </h2>
            <p className="text-base text-muted-foreground mt-2 max-w-sm">
              Ask about skills, experience, projects, and more. The AI is
              grounded in real professional data — no hallucination.
            </p>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role === "user" ? "user" : "assistant"}
              content={messageText(msg)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <ChatInput
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        isLoading={isLoading}
      />
    </div>
  );
}
