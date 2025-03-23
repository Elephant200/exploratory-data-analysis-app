import StreamingMarkdownRenderer from "@/components/StreamingMarkdownRenderer";
//import rehypeHighlight from "rehype-highlight";
//import { HTMLAttributes } from "react";

interface Part {
  text?: string;
  executable_code?: any;
}

interface AssistantMessageProps {
  parts: Part[];
}


export default function AssistantMessage({ parts }: AssistantMessageProps) {
  const textParts = parts
    .map((p) => p.text)
    .filter((t): t is string => !!t);

  console.log("textParts", textParts);

  return (
    <div className="assistant-message space-y-4">
      <StreamingMarkdownRenderer textParts={textParts} />
    </div>
  );
}