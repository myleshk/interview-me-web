"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 px-4 py-3 border-t border-border shrink-0 bg-background">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          const el = e.target;
          el.style.height = "auto";
          el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ask me anything..."
        disabled={isLoading}
        rows={1}
        className="min-h-[48px] max-h-[160px] resize-none bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary text-base"
      />

      {isLoading ? (
        <button
          type="button"
          onClick={onStop}
          className="shrink-0 h-[48px] w-[48px] inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim()}
          className="shrink-0 h-[48px] w-[48px] inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
