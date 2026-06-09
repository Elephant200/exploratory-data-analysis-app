import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const SUPPORTED_EXTENSIONS = ['.csv', '.tsv', '.json', '.xlsx', '.xls', '.txt'];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function extension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

function jsonToCsv(text: string): string {
  const data: unknown = JSON.parse(text);

  if (Array.isArray(data) && data.length > 0) {
    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      return Papa.unparse(data as Record<string, unknown>[]);
    }
    return Papa.unparse(
      data.map((item) => (Array.isArray(item) ? item : [item])),
    );
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    return Papa.unparse([Object.keys(record), Object.values(record)]);
  }

  throw new Error('JSON file must contain an array or object of data.');
}

function txtToCsv(text: string): string {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return text;

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes(',')
      ? ','
      : firstLine.includes(';')
        ? ';'
        : null;

  if (delimiter === null) {
    // No recognizable delimiter: one value per row.
    return Papa.unparse(lines.map((line) => [line]));
  }

  const parsed = Papa.parse<string[]>(text.trim(), { delimiter });
  return Papa.unparse(parsed.data);
}

function excelToCsv(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error('Excel file contains no sheets.');
  return XLSX.utils.sheet_to_csv(firstSheet);
}

/**
 * Convert an uploaded dataset to CSV text so the model's code-execution
 * sandbox always receives a uniform text/csv file.
 */
export async function convertToCsv(file: File): Promise<string> {
  const ext = extension(file.name);

  switch (ext) {
    case '.csv':
      return file.text();
    case '.tsv': {
      const parsed = Papa.parse<string[]>((await file.text()).trim(), { delimiter: '\t' });
      return Papa.unparse(parsed.data);
    }
    case '.json':
      return jsonToCsv(await file.text());
    case '.xlsx':
    case '.xls':
      return excelToCsv(await file.arrayBuffer());
    case '.txt':
      return txtToCsv(await file.text());
    default:
      throw new Error(`Unsupported file type: ${ext || file.name}`);
  }
}

/** Encode CSV text as a data URL for use as a message file part. */
export function csvToDataUrl(csvText: string): string {
  const bytes = new TextEncoder().encode(csvText);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:text/csv;base64,${btoa(binary)}`;
}
