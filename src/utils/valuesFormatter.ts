import {
  formatListValues,
  formatValuesPairs,
  parseFormattedListValues,
  type ListFormat,
} from './listFormat';
import { VALUES_PLACEHOLDER } from '../types';

/** Parse pasted input into individual values (any list formatter format). */
export function parseValuesInput(input: string): string[] {
  return parseFormattedListValues(input);
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/** Treat as numeric when it looks like a plain number (no leading zeros except "0"). */
export function isNumericValue(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

/** Format a single value for SQL VALUES clause (always quoted). */
export function formatSqlValue(value: string): string {
  return `'${escapeSqlString(value)}'`;
}

/** Guess the best insert format from the query SQL (for hints only). */
export function suggestValuesInsertFormat(sql: string): ListFormat | null {
  if (!sql.includes(VALUES_PLACEHOLDER)) return null;

  if (/VALUES[\s\S]*{{VALUES_PLACEHOLDER}}[\s\S]*\brow_num\b/i.test(sql)) {
    return 'values-pairs';
  }
  if (
    /ARRAY\s*\[\s*{{VALUES_PLACEHOLDER}}\s*\]/i.test(sql) ||
    /IN\s*\(\s*{{VALUES_PLACEHOLDER}}\s*\)/i.test(sql)
  ) {
    return 'quoted-commas';
  }
  return null;
}

/** Build the text inserted at {{VALUES_PLACEHOLDER}}. */
export function buildValuesInsert(
  values: string[],
  format: ListFormat,
  startIndex = 1,
): string {
  if (format === 'values-pairs') {
    return formatValuesPairs(values, startIndex, ',\n            ');
  }
  return formatListValues(values, format);
}

/** @deprecated Use buildValuesInsert with values-pairs format. */
export function buildValuesPairs(values: string[], startIndex = 1): string {
  return buildValuesInsert(values, 'values-pairs', startIndex);
}

export interface ValuesChunk {
  index: number;
  startRow: number;
  endRow: number;
  insertText: string;
  count: number;
}

/** Split values into chunks (default 1000) for large datasets. */
export function chunkValues(
  values: string[],
  chunkSize = 1000,
  insertFormat: ListFormat = 'plain',
): ValuesChunk[] {
  if (values.length === 0) return [];

  const chunks: ValuesChunk[] = [];
  for (let i = 0; i < values.length; i += chunkSize) {
    const slice = values.slice(i, i + chunkSize);
    chunks.push({
      index: chunks.length + 1,
      startRow: i + 1,
      endRow: i + slice.length,
      insertText: buildValuesInsert(slice, insertFormat, i + 1),
      count: slice.length,
    });
  }
  return chunks;
}

/** Replace placeholders in SQL with generated value text. */
export function applyPlaceholdersToQuery(
  sql: string,
  options: { valuesText: string; date?: string },
): string {
  let result = sql.replace(/\{\{VALUES_PLACEHOLDER\}\}/g, options.valuesText);
  if (options.date) {
    result = result.replace(/\{\{DATE_PLACEHOLDER\}\}/g, `'${options.date}'`);
  }
  return result;
}

/** Replace {{VALUES_PLACEHOLDER}} in SQL. */
export function applyValuesToQuery(sql: string, insertText: string, date?: string): string {
  return applyPlaceholdersToQuery(sql, { valuesText: insertText, date });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
