import { createAgentUIStreamResponse } from 'ai';

import {
  edaAgent,
  followUpAgent,
  EdaAgentUIMessage,
} from '@/lib/agents/eda-agent';

// Analyses with several code-execution rounds can run long.
export const maxDuration = 300;

/**
 * Two history fixes for Gemini's code-execution sandbox:
 *
 * 1. The sandbox only mounts files attached to the current turn, so a dataset
 *    uploaded earlier would be invisible to code on follow-up turns. Hoist the
 *    dataset file part onto the last user message (dropping earlier copies) so
 *    exactly one copy is sent per request.
 * 2. Charts the model generated come back in assistant messages as image file
 *    parts. They are outputs, not inputs — round-tripping them shifts the
 *    sandbox's input_file_N numbering and breaks execution, so strip them.
 *
 * Together these guarantee the dataset is always the only attached file and is
 * therefore always input_file_0.csv.
 */
function prepareHistory(messages: EdaAgentUIMessage[]): EdaAgentUIMessage[] {
  type Part = EdaAgentUIMessage['parts'][number];
  const isDataset = (part: Part) =>
    part.type === 'file' && part.mediaType === 'text/csv';

  const dataset = messages.flatMap((m) => m.parts).filter(isDataset).at(-1);
  const attachTo = dataset ? messages.at(-1) : undefined;

  return messages.map((message) => {
    const parts = message.parts.filter(
      (part) => part.type !== 'file' || (message === attachTo && isDataset(part)),
    );
    return message === attachTo && attachTo.role === 'user' && dataset
      ? { ...message, parts: [...parts.filter((p) => !isDataset(p)), dataset] }
      : { ...message, parts };
  });
}

/**
 * Replace past code-execution tool invocations with equivalent plain text.
 * Follow-up requests carry no tools, and Gemini rejects/stalls on histories
 * containing tool calls it cannot match to a declared tool — inlining keeps
 * the model's memory of what it computed without anything tool-shaped.
 */
function inlineToolResults(messages: EdaAgentUIMessage[]): EdaAgentUIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (part.type !== 'tool-code_execution') return part;
      const code = part.input?.code ?? '';
      const output =
        part.state === 'output-available' ? (part.output.output ?? '') : '';
      return {
        type: 'text' as const,
        text: `\n\`\`\`python\n${code}\n\`\`\`\n${output ? `Output:\n\`\`\`\n${output}\n\`\`\`\n` : ''}`,
      };
    }),
  }));
}

function toErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/overloaded|capacity/i.test(message)) {
    return 'The model is currently overloaded. Please try again in a moment.';
  }
  if (/quota|rate/i.test(message)) {
    return 'API quota exceeded. Please try again later.';
  }
  return `Sorry, I ran into an error: ${message}`;
}

export async function POST(req: Request) {
  const { messages }: { messages: EdaAgentUIMessage[] } = await req.json();

  // Code execution only works reliably on the first analysis turn; afterwards
  // the agent answers from prior results and the attached raw data.
  const isFollowUp = messages.some((message) => message.role === 'assistant');
  const history = prepareHistory(messages);

  if (isFollowUp) {
    return createAgentUIStreamResponse({
      agent: followUpAgent,
      uiMessages: inlineToolResults(history),
      onError: toErrorMessage,
    });
  }

  return createAgentUIStreamResponse({
    agent: edaAgent,
    uiMessages: history,
    onError: toErrorMessage,
  });
}
