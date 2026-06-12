export type ListFormat =
  | 'plain'
  | 'commas'
  | 'quoted'
  | 'quoted-commas'
  | 'values-pairs';

export const LIST_FORMAT_OPTIONS: { id: ListFormat; label: string }[] = [
  { id: 'plain', label: 'Plain' },
  { id: 'commas', label: 'Commas' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'quoted-commas', label: 'Quoted + commas' },
  { id: 'values-pairs', label: 'SQL pairs' },
];

function escapeSingleQuoted(value: string): string {
  return value.replace(/'/g, "''");
}

const VALUES_PAIR_PATTERN = /\(\s*'((?:[^']|'')*)'\s*,\s*\d+\s*\)/g;

/** Build numbered SQL VALUES tuples: ('value', row), … */
export function formatValuesPairs(
  values: string[],
  startIndex = 1,
  pairJoin = ', ',
): string {
  return values
    .map((value, index) => `('${escapeSingleQuoted(value)}', ${startIndex + index})`)
    .join(pairJoin);
}

/** Extract values from SQL-style ('value', row) tuples. */
function parseValuesPairs(input: string): string[] | null {
  const values: string[] = [];
  for (const match of input.matchAll(VALUES_PAIR_PATTERN)) {
    values.push(match[1].replace(/''/g, "'"));
  }
  return values.length > 0 ? values : null;
}

/** Strip quotes, trailing commas, and whitespace from one token. */
export function stripFormattedToken(raw: string): string {
  let value = raw.trim();
  if (!value) return '';

  value = value.replace(/,\s*$/, '');

  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1).replace(/''/g, "'");
  }

  return value.trim();
}

/** Parse values from plain, comma, or quoted lists (mixed formats allowed). */
export function parseFormattedListValues(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const fromPairs = parseValuesPairs(trimmed);
  if (fromPairs) return fromPairs;

  const values: string[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.includes(',')) {
      for (const part of trimmedLine.split(',')) {
        const value = stripFormattedToken(part);
        if (value) values.push(value);
      }
    } else {
      const value = stripFormattedToken(trimmedLine);
      if (value) values.push(value);
    }
  }

  return values;
}

export function formatListValues(values: string[], format: ListFormat): string {
  switch (format) {
    case 'plain':
      return values.join('\n');
    case 'commas':
      return values.map((value) => `${value},`).join('\n');
    case 'quoted':
      return values.map((value) => `'${escapeSingleQuoted(value)}'`).join('\n');
    case 'quoted-commas':
      return values.map((value) => `'${escapeSingleQuoted(value)}',`).join('\n');
    case 'values-pairs':
      return formatValuesPairs(values);
  }
}

export function convertListFormat(input: string, format: ListFormat): string {
  return formatListValues(parseFormattedListValues(input), format);
}
