"use client";

import { FileSpreadsheet } from "lucide-react";

import type { EdaAgentUIMessage } from "@/lib/agents/eda-agent";
import { displayFilename } from "@/lib/filename-map";
import { Markdown } from "./markdown";
import { ChartImage } from "./chart-image";
import { CodeBlock, CodeResult, CodeExecutionStatus } from "./code-block";

type UIMessage = EdaAgentUIMessage;

interface CodeExecution {
  code: string;
  status: CodeExecutionStatus;
  output?: string;
}

/** Map a code-execution tool invocation to its display state. */
function asCodeExecution(part: UIMessage["parts"][number]): CodeExecution | null {
  if (part.type !== "tool-code_execution") return null;

  switch (part.state) {
    case "output-error":
      return { code: part.input?.code ?? "", status: "error", output: part.errorText };
    case "output-available": {
      const failed =
        part.output.outcome !== undefined && part.output.outcome !== "OUTCOME_OK";
      return {
        code: part.input?.code ?? "",
        status: failed ? "error" : "done",
        output: part.output.output,
      };
    }
    default:
      return { code: part.input?.code ?? "", status: "running" };
  }
}

function UserMessage({
  message,
  datasetName,
}: {
  message: UIMessage;
  datasetName: string | null;
}) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  const file = message.parts.find((part) => part.type === "file");

  return (
    <div className="animate-rise flex flex-col items-end gap-1.5">
      {file && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal-soft px-3 py-1 font-mono text-[0.72rem] text-teal">
          <FileSpreadsheet className="size-3.5" aria-hidden />
          {file.filename ?? datasetName ?? "dataset.csv"}
        </span>
      )}
      {text && (
        <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-amber/25 bg-amber-soft px-4 py-2.5 text-[0.9375rem] leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({
  message,
  datasetName,
  isStreaming,
}: {
  message: UIMessage;
  datasetName: string | null;
  isStreaming: boolean;
}) {
  const lastTextIndex = message.parts.findLastIndex(
    (part) => part.type === "text",
  );

  return (
    <div className="animate-rise">
      <div className="mb-2 flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-amber" aria-hidden />
        <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
          Agent
        </span>
      </div>
      <div className="border-l border-ink-border pl-4">
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            const caret =
              isStreaming && index === lastTextIndex ? "streaming-caret" : "";
            return (
              <div key={index} className={caret}>
                <Markdown text={displayFilename(part.text, datasetName)} />
              </div>
            );
          }

          if (part.type === "reasoning") {
            if (!part.text.trim()) return null;
            return (
              <div
                key={index}
                className="my-2 font-mono text-[0.78rem] italic leading-relaxed text-muted"
              >
                {part.text}
              </div>
            );
          }

          if (part.type === "file" && part.mediaType?.startsWith("image/")) {
            return <ChartImage key={index} src={part.url} />;
          }

          const execution = asCodeExecution(part);
          if (execution) {
            return (
              <div key={index}>
                {execution.code && (
                  <CodeBlock
                    code={displayFilename(execution.code, datasetName)}
                    status={execution.status}
                  />
                )}
                {execution.output && (
                  <CodeResult
                    output={displayFilename(execution.output, datasetName)}
                    isError={execution.status === "error"}
                  />
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

export function Message({
  message,
  datasetName,
  isStreaming,
}: {
  message: UIMessage;
  datasetName: string | null;
  isStreaming: boolean;
}) {
  if (message.role === "user") {
    return <UserMessage message={message} datasetName={datasetName} />;
  }
  return (
    <AssistantMessage
      message={message}
      datasetName={datasetName}
      isStreaming={isStreaming}
    />
  );
}
