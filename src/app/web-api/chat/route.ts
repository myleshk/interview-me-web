import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// createOpenAI adds /v1 automatically — baseURL must NOT include it.
// Set via env var: local dev → .env, k8s → deployment spec
const API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

const openai = createOpenAI({
  baseURL: API_URL,
  apiKey: "",
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Convert AI SDK v6 UIMessage (parts[]) → OpenAI ModelMessage (content string)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const converted: any = messages.map(
    (msg: { role: string; parts?: Array<{ type: string; text?: string }> }) => ({
      role: msg.role,
      content:
        msg.parts
          ?.filter((p) => p.type === "text")
          .map((p) => p.text ?? "")
          .join("") ?? "",
    }),
  );

  const result = streamText({
    model: openai.chat("interview-me"),
    messages: converted,
  });

  return result.toUIMessageStreamResponse();
}
