"use client";

import type { AppConfig } from "@/lib/config";
import { FileText } from "lucide-react";

interface IdentityHeaderProps {
  identity: AppConfig["identity"];
  cvUrl: string;
}

export function IdentityHeader({ identity, cvUrl }: IdentityHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold text-sm">
            {identity.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">
            {identity.name}
          </h1>
          {identity.title && (
            <p className="text-xs text-muted-foreground truncate">
              {identity.title}
              {identity.employer ? ` @ ${identity.employer}` : ""}
              {identity.location ? ` · ${identity.location}` : ""}
            </p>
          )}
        </div>
      </div>

      {cvUrl && (
        <a
          href={cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 shrink-0 transition-colors"
        >
          <FileText className="h-4 w-4" />
          CV
        </a>
      )}
    </header>
  );
}
