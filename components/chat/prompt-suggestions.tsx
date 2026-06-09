"use client";

import { Database, Sparkles, HelpCircle, FileQuestion } from "lucide-react";

export interface Suggestion {
  label: string;
  /** Message sent to the agent; if absent, `action` runs instead. */
  message?: string;
  action?: "demo";
  icon: "demo" | "capabilities" | "prepare" | "formats";
}

export const SUGGESTIONS: Suggestion[] = [
  {
    label: "Try the demo dataset",
    action: "demo",
    icon: "demo",
  },
  {
    label: "What kinds of analysis can you do?",
    message: "What kinds of analysis can you do?",
    icon: "capabilities",
  },
  {
    label: "How should I prepare my data?",
    message: "How should I prepare my data before uploading it?",
    icon: "prepare",
  },
  {
    label: "Which file formats work?",
    message: "Which file formats can I upload?",
    icon: "formats",
  },
];

const ICONS = {
  demo: Database,
  capabilities: Sparkles,
  prepare: HelpCircle,
  formats: FileQuestion,
} as const;

export function PromptSuggestions({
  onSelect,
}: {
  onSelect: (suggestion: Suggestion) => void;
}) {
  return (
    <div className="animate-rise mx-auto flex max-w-md flex-col items-stretch gap-2 pt-4">
      {SUGGESTIONS.map((suggestion) => {
        const Icon = ICONS[suggestion.icon];
        const isDemo = suggestion.action === "demo";
        return (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onSelect(suggestion)}
            className={`group flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              isDemo
                ? "border-amber/40 bg-amber-soft text-paper hover:border-amber/70"
                : "border-ink-border bg-ink-raised text-paper-dim hover:border-ink-border-strong hover:text-paper"
            }`}
          >
            <Icon
              className={`size-4 shrink-0 ${isDemo ? "text-amber" : "text-muted group-hover:text-amber"} transition-colors`}
              aria-hidden
            />
            {suggestion.label}
            {isDemo && (
              <span className="ml-auto font-mono text-[0.68rem] uppercase tracking-[0.1em] text-amber/70">
                ConEd gas data
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
