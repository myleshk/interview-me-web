"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

/** Shared markdown component overrides — keep the bubble clean. */
const mdComponents: Partial<Components> = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ className, children, ...props }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className="bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="block bg-black/10 dark:bg-white/10 rounded-lg p-3 text-sm font-mono overflow-x-auto my-2"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="not-prose my-2">{children}</pre>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline decoration-primary/40 hover:decoration-primary"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border" />,
  h1: ({ children }) => <h1 className="text-lg font-semibold mt-3 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
  table: ({ children }) => (
    <table className="w-full border-collapse my-2 text-sm">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border border-border px-2 py-1 bg-black/5 dark:bg-white/5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-2 py-1">{children}</td>
  ),
};

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
          <span className="text-primary font-semibold text-xs">AI</span>
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md",
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{content}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={mdComponents}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center mt-0.5">
          <span className="text-secondary-foreground font-semibold text-xs">
            You
          </span>
        </div>
      )}
    </div>
  );
}
