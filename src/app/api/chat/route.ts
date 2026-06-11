import { readFileSync } from "fs";
import path from "path";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

/** Read config.json from disk — cached per process lifetime. */
let _cachedApiUrl = "";

function getApiUrl(): string {
  if (_cachedApiUrl) return _cachedApiUrl;
  try {
    const configPath = path.join(process.cwd(), "public", "config.json");
    const raw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw);
    _cachedApiUrl = config.apiUrl || "http://localhost:8000";
  } catch {
    _cachedApiUrl = "http://localhost:8000";
  }
  return _cachedApiUrl;
}

// createOpenAI adds /v1 automatically — baseURL must NOT include it.
const openai = createOpenAI({
  baseURL: getApiUrl(),
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
