"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import hljs from "highlight.js";

function HighlightedCode({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const language = /language-(\w+)/.exec(className ?? "")?.[1];
  const code = String(children ?? "").replace(/\n$/, "");

  // Inline code has no language class and no newlines.
  if (!className && !code.includes("\n")) {
    return <code>{code}</code>;
  }

  const highlighted =
    language && hljs.getLanguage(language)
      ? hljs.highlight(code, { language }).value
      : hljs.highlightAuto(code).value;

  return (
    <code
      className={`hljs ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{ code: HighlightedCode }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
