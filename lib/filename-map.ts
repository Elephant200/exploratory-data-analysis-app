/**
 * Gemini's code-execution sandbox always exposes the attached dataset as
 * "input_file_0.csv". Swap in the real filename for display only.
 */
export function displayFilename(text: string, realFilename: string | null): string {
  if (!realFilename) return text;
  return text.replaceAll('input_file_0.csv', realFilename);
}
