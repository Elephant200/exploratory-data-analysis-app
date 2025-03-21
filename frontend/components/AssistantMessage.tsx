import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { HTMLAttributes } from "react";

interface Part {
  text?: string;
  code_execution?: any;
}

interface AssistantMessageProps {
  parts: Part[];
}

export default function AssistantMessage({ parts }: AssistantMessageProps) {
  return (
    <div className="assistant-message space-y-4">
      {parts.map((part, index) =>
        part.text ? (
          <ReactMarkdown
            key={`text-${index}`}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: (props: HTMLAttributes<HTMLParagraphElement>) => (
                <p {...props} className="text-sm leading-relaxed" />
              ),
              pre: (props: HTMLAttributes<HTMLPreElement>) => (
                <pre
                  {...props}
                  className="bg-gray-900 text-white p-3 rounded overflow-auto text-xs"
                />
              ),
              code: (props: HTMLAttributes<HTMLElement>) => (
                <code {...props} className="text-green-400" />
              ),
            }}
          >
            {part.text}
          </ReactMarkdown>
        ) : null
      )}
      {parts.map((part, index) =>
        part.code_execution ? (
          <div
            key={`exec-${index}`}
            className="bg-black text-green-400 p-3 rounded text-xs font-mono whitespace-pre-wrap"
          >
            <p className="mb-1 text-gray-400">Code Output:</p>
            <pre>{JSON.stringify(part.code_execution, null, 2)}</pre>
          </div>
        ) : null
      )}
    </div>
  );
}
