import type { QueryItem } from './types';
import { SQL_EDITOR_PLACEHOLDER } from './types';

const LEGACY_STORAGE_KEY = 'dakato-query-tools';

function normalizeQueries(queries: QueryItem[]): QueryItem[] {
  return queries.map((q) =>
    q.sql === SQL_EDITOR_PLACEHOLDER ? { ...q, sql: '' } : q,
  );
}

export async function loadQueries(): Promise<QueryItem[]> {
  const fromFile = normalizeQueries(await fetchQueries());

  const legacy = readLegacyLocalStorage();
  if (legacy.length > 0) {
    const normalized = normalizeQueries(legacy);
    await saveQueries(normalized);
    clearLegacyLocalStorage();
    return normalized;
  }

  return fromFile;
}

export async function saveQueries(queries: QueryItem[]): Promise<void> {
  const res = await fetch('/api/queries', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queries),
  });

  if (!res.ok) {
    throw new Error(`Failed to save queries (${res.status})`);
  }
}

async function fetchQueries(): Promise<QueryItem[]> {
  const res = await fetch('/api/queries');
  if (!res.ok) {
    throw new Error(`Failed to load queries (${res.status})`);
  }
  return res.json() as Promise<QueryItem[]>;
}

function readLegacyLocalStorage(): QueryItem[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clearLegacyLocalStorage(): void {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
