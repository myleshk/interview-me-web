import { ChatApp } from "./ChatApp";
import type { AppConfig } from "@/lib/config";

function env(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function loadConfig(): AppConfig {
  return {
    identity: {
      name: env("NEXT_PUBLIC_IDENTITY_NAME", "Candidate"),
      title: env("NEXT_PUBLIC_IDENTITY_TITLE", ""),
      employer: env("NEXT_PUBLIC_IDENTITY_EMPLOYER", ""),
      location: env("NEXT_PUBLIC_IDENTITY_LOCATION", ""),
    },
    cvUrl: env("NEXT_PUBLIC_CV_URL", ""),
  };
}

export default function Page() {
  const config = loadConfig();
  return <ChatApp config={config} />;
}
