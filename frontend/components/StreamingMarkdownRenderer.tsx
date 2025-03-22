"use client";
import { useState, useEffect } from "react";
import { md } from "@/lib/markdown";

interface Props {
  textParts: string[]; // streamed from Gemini
}

export default function StreamingMarkdownRenderer({ textParts }: Props) {
  const [blocks, setBlocks] = useState<string[]>([]); // rendered blocks
  const [buffer, setBuffer] = useState<string>("");   // building current block

  useEffect(() => {
    const fullText = textParts.join("");

    const tokens = md.parse(fullText, {});
    const blockEnds = tokens.reduce<number[]>((indexes, token, i) => {
      if (token.nesting === 0 && token.level === 0) {
        indexes.push(i);
      }
      return indexes;
    }, []);

    // Convert each complete block to rendered HTML
    const renderedBlocks = blockEnds.map((endIndex, i, arr) => {
      const startIndex = arr[i - 1] ?? 0;
      const tokenSlice = tokens.slice(startIndex, endIndex + 1);
      return md.renderer.render(tokenSlice, md.options, {});
    });

    setBlocks(renderedBlocks);
  }, [textParts]);

  return (
    <div className="prose prose-invert text-sm max-w-none">
      {blocks.map((html, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
      ))}
    </div>
  );
}
