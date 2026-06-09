"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Check, X, Terminal } from "lucide-react";
import hljs from "highlight.js";

export type CodeExecutionStatus = "running" | "done" | "error";

export function CodeBlock({
  code,
  status,
}: {
  code: string;
  status: CodeExecutionStatus;
}) {
  const [open, setOpen] = useState(true);
  const highlighted = hljs.highlight(code, { language: "python" }).value;

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-ink-border bg-ink-raised">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 border-b border-ink-border bg-ink-panel px-3 py-2 text-left"
      >
        <Terminal className="size-3.5 text-amber" aria-hidden />
        <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em] text-amber">
          Python
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted">
          {status === "running" && (
            <>
              <Loader2 className="spinner size-3.5 text-amber" aria-hidden />
              Running
            </>
          )}
          {status === "done" && (
            <>
              <Check className="size-3.5 text-teal" aria-hidden />
              Executed
            </>
          )}
          {status === "error" && (
            <>
              <X className="size-3.5 text-red" aria-hidden />
              Failed
            </>
          )}
        </span>
        <ChevronDown
          className={`size-4 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
      {open && (
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[0.8rem] leading-relaxed">
          <code
            className="hljs"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      )}
    </div>
  );
}

export function CodeResult({
  output,
  isError,
}: {
  output: string;
  isError?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const lineCount = output.split("\n").length;

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-ink-border bg-ink-raised">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 border-b border-ink-border bg-ink-panel px-3 py-2 text-left"
      >
        <span
          className={`font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em] ${isError ? "text-red" : "text-teal"}`}
        >
          {isError ? "Error output" : "Output"}
        </span>
        <span className="ml-auto font-mono text-[0.7rem] text-muted">
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
        <ChevronDown
          className={`size-4 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
      {open && (
        <pre
          className={`max-h-80 overflow-auto px-4 py-3 font-mono text-[0.8rem] leading-relaxed whitespace-pre-wrap ${isError ? "text-red" : "text-paper-dim"}`}
        >
          {output}
        </pre>
      )}
    </div>
  );
}
