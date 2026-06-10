/** SSE streaming client for the interview-me API.
 *
 * Connects to ``POST /v1/chat/completions`` with ``stream: true``
 * and yields tokens via an async generator. Supports cancellation
 * via ``AbortSignal``.
 */

import type { ChatMessage } from "./config";

interface SseChunk {
  choices: {
    index: number;
    delta: { role?: string; content?: string };
    finish_reason: string | null;
  }[];
}

export async function* streamChat(
  apiUrl: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, undefined> {
  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "interview-me",
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown error");
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json: SseChunk = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) {
            yield delta.content;
          }
        } catch {
          // skip malformed SSE lines (transient network noise)
        }
      }
    }
  } finally {
    // Always release the reader — handles both normal completion and abort.
    reader.releaseLock();
  }
}
