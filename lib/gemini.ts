import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const GEMINI_MODEL = 'gemini-3.5-flash';

export const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
