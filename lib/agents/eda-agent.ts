import { ToolLoopAgent, InferAgentUIMessage } from 'ai';

import { google, GEMINI_MODEL } from '@/lib/gemini';
import { SYSTEM_PROMPT, FOLLOW_UP_ADDENDUM } from '@/lib/system-prompt';

/** First turn: full EDA with Gemini's code-execution sandbox. */
export const edaAgent = new ToolLoopAgent({
  model: google(GEMINI_MODEL),
  instructions: SYSTEM_PROMPT,
  tools: { code_execution: google.tools.codeExecution({}) },
});

/**
 * Follow-up turns: no tools. Gemini's code-execution sandbox does not
 * reliably run on requests whose history contains earlier code-execution
 * turns, so follow-ups answer from the prior analysis (inlined as text)
 * and the attached raw dataset instead.
 */
export const followUpAgent = new ToolLoopAgent({
  model: google(GEMINI_MODEL),
  instructions: SYSTEM_PROMPT + FOLLOW_UP_ADDENDUM,
});

export type EdaAgentUIMessage = InferAgentUIMessage<typeof edaAgent>;
