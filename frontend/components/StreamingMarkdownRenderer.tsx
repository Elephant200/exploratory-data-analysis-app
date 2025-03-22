"use client";
import { useEffect, useState } from "react";
import { md } from "@/lib/markdown";

interface Props {
  textParts: string[];
}

export default function StreamingMarkdownRenderer({ textParts }: Props) {
  const [blocks, setBlocks] = useState<string[]>([]);

  useEffect(() => {
    const fullText = textParts.join("");
    console.log("StreamingMarkdown input:", fullText);

    const html = md.render(fullText);
    setBlocks([html]);
  }, [textParts]);

  return (
    <div className="prose prose-invert text-sm max-w-none">
      {blocks.map((html, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
      ))}
    </div>
  );
}
