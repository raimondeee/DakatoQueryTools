import { describe, expect, it } from 'vitest';
import type { QueryItem } from '../types';
import { mergeQueries, parseImportFile } from './queryImportExport';

describe('parseImportFile', () => {
  const sample: QueryItem[] = [
    {
      id: 'a',
      name: 'Q1',
      sql: 'SELECT 1',
      target: 'sqllab',
      hasValuesPlaceholder: false,
      hasDatePlaceholder: false,
      notes: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('parses export file format', () => {
    const text = JSON.stringify({ version: 1, exportedAt: 'x', queries: sample });
    expect(parseImportFile(text)).toHaveLength(1);
  });

  it('parses bare array', () => {
    expect(parseImportFile(JSON.stringify(sample))).toHaveLength(1);
  });

  it('merges without overwriting existing ids', () => {
    const existing = [{ ...sample[0] }];
    const imported = [{ ...sample[0], id: 'b', name: 'Q2' }];
    const merged = mergeQueries(existing, imported);
    expect(merged).toHaveLength(2);
  });
});
