"use client";

import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  FileSpreadsheet,
  Loader2,
  Paperclip,
  RotateCcw,
  Square,
} from "lucide-react";

import type { EdaAgentUIMessage } from "@/lib/agents/eda-agent";
import {
  convertToCsv,
  csvToDataUrl,
  MAX_FILE_SIZE,
  SUPPORTED_EXTENSIONS,
} from "@/lib/convert-to-csv";
import { Message } from "./message";
import { PromptSuggestions, Suggestion } from "./prompt-suggestions";

const DEFAULT_ANALYZE_PROMPT =
  "Please analyze this dataset and provide a summary of the data.";
const CONTEXT_PLACEHOLDER =
  "Add context about your data (optional), then send to start the analysis…";
const DEMO_FILE_URL = "/demo/CONED Natural Gas Data.csv";
const DEMO_FILE_NAME = "CONED Natural Gas Data.csv";
const ACCEPT = SUPPORTED_EXTENSIONS.join(",");

interface Dataset {
  name: string;
  dataUrl: string;
}

export function Chat() {
  const { messages, sendMessage, status, error, regenerate, stop, setMessages } =
    useChat<EdaAgentUIMessage>();

  const [input, setInput] = useState("");
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasetSent, setDatasetSent] = useState(false);
  const [converting, setConverting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledAwayRef = useRef(false);
  const demoStartedRef = useRef(false);
  const searchParams = useSearchParams();

  const busy = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;
  const hasUnsentDataset = dataset !== null && !datasetSent;

  /** Convert and attach a dataset; the user sends it (with optional context). */
  async function attachDataset(file: File): Promise<Dataset | null> {
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File is larger than 2 MB. Please upload a smaller file.");
      return null;
    }

    setConverting(true);
    try {
      const csv = await convertToCsv(file);
      const next = { name: file.name, dataUrl: csvToDataUrl(csv) };
      setDataset(next);
      messageInputRef.current?.focus();
      return next;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not read file.");
      return null;
    } finally {
      setConverting(false);
    }
  }

  function sendWithDataset(text: string, attached: Dataset) {
    sendMessage({
      text,
      files: [
        {
          type: "file",
          filename: attached.name,
          mediaType: "text/csv",
          url: attached.dataUrl,
        },
      ],
    });
    setDatasetSent(true);
    scrolledAwayRef.current = false;
  }

  async function startDemo() {
    if (dataset || busy || converting) return;
    setUploadError(null);
    setConverting(true);
    try {
      const response = await fetch(DEMO_FILE_URL);
      if (!response.ok) throw new Error("Failed to fetch the demo dataset.");
      const blob = await response.blob();
      setConverting(false);
      const attached = await attachDataset(
        new File([blob], DEMO_FILE_NAME, { type: "text/csv" }),
      );
      // The demo skips the context step and starts analyzing right away.
      if (attached) {
        sendWithDataset(input.trim() || DEFAULT_ANALYZE_PROMPT, attached);
        setInput("");
      }
    } catch (err) {
      setConverting(false);
      setUploadError(
        err instanceof Error ? err.message : "Demo dataset failed to load.",
      );
    }
  }

  // ?demo=coned deep link: load the demo dataset and start analysis.
  useEffect(() => {
    if (searchParams.get("demo") !== "coned" || demoStartedRef.current) return;
    demoStartedRef.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    void startDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Auto-scroll unless the user scrolled away from the bottom.
  useEffect(() => {
    const container = scrollRef.current;
    if (container && !scrolledAwayRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;
    scrolledAwayRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight > 100;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || converting) return;
    const text = input.trim();

    if (hasUnsentDataset) {
      // First send after attaching: dataset + the user's context (if any).
      sendWithDataset(text || DEFAULT_ANALYZE_PROMPT, dataset);
    } else if (text) {
      sendMessage({ text });
      scrolledAwayRef.current = false;
    } else {
      return;
    }
    setInput("");
  }

  function handleSuggestion(suggestion: Suggestion) {
    if (suggestion.action === "demo") {
      void startDemo();
    } else if (suggestion.message) {
      sendMessage({ text: suggestion.message });
    }
  }

  function resetSession() {
    stop();
    setMessages([]);
    setDataset(null);
    setDatasetSent(false);
    setUploadError(null);
    setInput("");
    scrolledAwayRef.current = false;
  }

  const showThinking =
    status === "submitted" ||
    (status === "streaming" && messages.at(-1)?.role === "user");

  return (
    <div
      className="flex h-dvh flex-col"
      onDragOver={(event) => {
        if (!dataset && event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        setDragging(false);
        if (dataset) return;
        const file = event.dataTransfer.files?.[0];
        if (file) {
          event.preventDefault();
          void attachDataset(file);
        }
      }}
    >
      {/* header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-ink-border px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-paper"
        >
          EDA<span className="text-amber">·</span>Agent
        </Link>
        <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted sm:inline">
          Exploratory data analysis
        </span>
        <div className="ml-auto flex items-center gap-2">
          {dataset && (
            <span className="inline-flex max-w-48 items-center gap-1.5 truncate rounded-full border border-teal/40 bg-teal-soft px-3 py-1 font-mono text-[0.72rem] text-teal">
              <FileSpreadsheet className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{dataset.name}</span>
            </span>
          )}
          {(!isEmpty || dataset) && (
            <button
              type="button"
              onClick={resetSession}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-border px-3 py-1 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted transition-colors hover:border-ink-border-strong hover:text-paper"
            >
              <RotateCcw className="size-3" aria-hidden />
              New session
            </button>
          )}
        </div>
      </header>

      {/* messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
          {isEmpty ? (
            <div className="flex flex-col items-center pt-[8vh] text-center">
              <h1 className="font-display text-4xl tracking-tight text-paper sm:text-5xl">
                What does your data <em className="text-amber">say</em>?
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-paper-dim">
                Upload a dataset and an autonomous agent will profile it, write
                and run Python, and stream back statistics and charts.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={converting || hasUnsentDataset}
                className={`mt-8 w-full max-w-md rounded-xl border border-dashed px-6 py-8 transition-colors ${
                  dragging
                    ? "border-amber bg-amber-soft"
                    : hasUnsentDataset
                      ? "border-teal/50 bg-teal-soft"
                      : "border-ink-border-strong bg-ink-raised/60 hover:border-amber/60 hover:bg-ink-raised"
                }`}
              >
                {converting ? (
                  <span className="inline-flex items-center gap-2 text-sm text-paper-dim">
                    <Loader2 className="spinner size-4 text-amber" aria-hidden />
                    Preparing dataset…
                  </span>
                ) : hasUnsentDataset ? (
                  <>
                    <span className="inline-flex items-center gap-2 text-sm text-teal">
                      <FileSpreadsheet className="size-4" aria-hidden />
                      {dataset.name} attached
                    </span>
                    <span className="mt-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
                      Tell the agent about your data below, or just hit send
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-sm text-paper">
                      Drop a file here or{" "}
                      <span className="text-amber underline underline-offset-4">
                        browse
                      </span>
                    </span>
                    <span className="mt-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
                      CSV · TSV · JSON · Excel · TXT — max 2 MB
                    </span>
                  </>
                )}
              </button>

              {uploadError && (
                <p className="mt-3 text-sm text-red">{uploadError}</p>
              )}

              {!hasUnsentDataset && (
                <PromptSuggestions onSelect={handleSuggestion} />
              )}
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  datasetName={dataset?.name ?? null}
                  isStreaming={
                    status === "streaming" && index === messages.length - 1
                  }
                />
              ))}

              {showThinking && (
                <div className="animate-rise flex items-center gap-2">
                  <span className="pulse-dot size-1.5 rounded-full bg-amber" aria-hidden />
                  <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted">
                    Agent is thinking…
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red/40 bg-red-soft px-4 py-3 text-sm text-red">
                  <span>{error.message || "Something went wrong."}</span>
                  <button
                    type="button"
                    onClick={() => regenerate()}
                    className="shrink-0 rounded-full border border-red/40 px-3 py-1 font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors hover:bg-red/20"
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-ink-border bg-ink/85 px-4 py-3 backdrop-blur sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void attachDataset(file);
              event.target.value = "";
            }}
          />
          {!dataset && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={converting || busy}
              title="Attach a dataset"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ink-border text-muted transition-colors hover:border-amber/60 hover:text-amber disabled:opacity-50"
            >
              {converting ? (
                <Loader2 className="spinner size-4" aria-hidden />
              ) : (
                <Paperclip className="size-4" aria-hidden />
              )}
            </button>
          )}
          <input
            ref={messageInputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              hasUnsentDataset
                ? CONTEXT_PLACEHOLDER
                : dataset
                  ? `Ask anything about ${dataset.name}…`
                  : "Ask about data analysis, or attach a dataset…"
            }
            className="h-10 min-w-0 flex-1 rounded-full border border-ink-border bg-ink-raised px-4 text-[0.9375rem] text-paper placeholder:text-muted focus:border-amber/60 focus:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              title="Stop"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-amber/50 bg-amber-soft text-amber transition-colors hover:bg-amber/25"
            >
              <Square className="size-3.5 fill-current" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && !hasUnsentDataset}
              title={hasUnsentDataset ? "Start analysis" : "Send"}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber text-ink transition-opacity hover:opacity-90 disabled:opacity-35"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
          )}
        </form>
        {uploadError && !isEmpty && (
          <p className="mx-auto mt-2 max-w-3xl text-xs text-red">{uploadError}</p>
        )}
      </div>
    </div>
  );
}
