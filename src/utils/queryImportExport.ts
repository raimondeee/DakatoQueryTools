import type { QueryItem, QueryTarget } from '../types';

export const EXPORT_VERSION = 1;

export interface QueryExportFile {
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  queries: QueryItem[];
}

export function createExportFile(queries: QueryItem[]): QueryExportFile {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    queries,
  };
}

export function downloadQueriesJson(queries: QueryItem[], filename?: string): void {
  const payload = createExportFile(queries);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download =
    filename ?? `dakato-queries-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isQueryTarget(value: unknown): value is QueryTarget {
  return value === 'sqllab' || value === 'datako';
}

function normalizeQuery(raw: Record<string, unknown>): QueryItem | null {
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  if (typeof raw.sql !== 'string') return null;
  if (!isQueryTarget(raw.target)) return null;

  const now = new Date().toISOString();
  return {
    id: raw.id,
    name: raw.name,
    sql: raw.sql,
    target: raw.target,
    hasValuesPlaceholder: Boolean(raw.hasValuesPlaceholder),
    hasDatePlaceholder: Boolean(raw.hasDatePlaceholder),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    favorite: Boolean(raw.favorite),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

/** Parse an imported JSON file into validated queries. */
export function parseImportFile(text: string): QueryItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file');
  }

  let items: unknown[];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as QueryExportFile).queries)
  ) {
    items = (parsed as QueryExportFile).queries;
  } else {
    throw new Error('Expected a queries array or export file with a queries field');
  }

  const queries: QueryItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const normalized = normalizeQuery(item as Record<string, unknown>);
    if (normalized) queries.push(normalized);
  }

  if (queries.length === 0) {
    throw new Error('No valid queries found in file');
  }

  return queries;
}

export type ImportMode = 'replace' | 'merge';

/** Merge imported queries; existing IDs are kept, new IDs are appended. */
export function mergeQueries(existing: QueryItem[], imported: QueryItem[]): QueryItem[] {
  const byId = new Map(existing.map((q) => [q.id, q]));
  for (const query of imported) {
    if (!byId.has(query.id)) {
      byId.set(query.id, query);
    }
  }
  return Array.from(byId.values());
}

export function replaceQueries(imported: QueryItem[]): QueryItem[] {
  return imported;
}
