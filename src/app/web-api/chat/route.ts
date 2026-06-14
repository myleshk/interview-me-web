import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { RATE_LIMIT, rateLimit, getCookieValue } from "@/lib/rate-limit";

// createOpenAI appends /chat/completions to baseURL — BACKEND_API_URL must include /v1.
// Local dev: http://localhost:8000/v1  |  K8s: http://api:8000/v1
// Set via env var: local dev → .env, k8s → ArgoCD deployment spec
const API_URL = process.env.BACKEND_API_URL || "http://localhost:8000/v1";

const openai = createOpenAI({
  baseURL: API_URL,
  apiKey: "",
});

export async function POST(req: Request) {
  // ── Rate limit: 20/min per cookie ───────────────────
  const cookie = getCookieValue(req);
  if (!cookie) {
    return new Response("Unauthorized", { status: 401 });
  }
  const rl = rateLimit(`chat:${cookie}`, RATE_LIMIT.chat.limit, RATE_LIMIT.chat.windowSeconds);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

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
