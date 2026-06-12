import { describe, expect, it } from 'vitest';
import {
  applyValuesToQuery,
  buildValuesInsert,
  buildValuesPairs,
  chunkValues,
  formatSqlValue,
  isNumericValue,
  parseValuesInput,
  suggestValuesInsertFormat,
} from './valuesFormatter';
import { VALUES_PLACEHOLDER } from '../types';

describe('parseValuesInput', () => {
  it('parses newline-separated values', () => {
    expect(parseValuesInput('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('parses comma-separated on one line', () => {
    expect(parseValuesInput('a, b, c')).toEqual(['a', 'b', 'c']);
  });

  it('parses mixed lines with commas', () => {
    expect(parseValuesInput('a, b\nc')).toEqual(['a', 'b', 'c']);
  });

  it('parses quoted and SQL pair formats', () => {
    expect(parseValuesInput("'724984367',\n'350840928',")).toEqual([
      '724984367',
      '350840928',
    ]);
    expect(parseValuesInput("('001abc', 1), ('002def', 2)")).toEqual([
      '001abc',
      '002def',
    ]);
  });
});

describe('buildValuesInsert', () => {
  it('inserts plain values', () => {
    expect(buildValuesInsert(['HM3GHI789', 'HM2DEF456', 'HM1ABC123'], 'plain')).toBe(
      'HM3GHI789\nHM2DEF456\nHM1ABC123',
    );
  });

  it('inserts quoted comma-separated values', () => {
    expect(buildValuesInsert(['a', 'b'], 'quoted-commas')).toBe("'a',\n'b',");
  });

  it('inserts SQL values pairs', () => {
    expect(buildValuesInsert(['001abc', '002def'], 'values-pairs', 1)).toBe(
      "('001abc', 1),\n            ('002def', 2)",
    );
  });
});

describe('suggestValuesInsertFormat', () => {
  it('suggests SQL pairs for row_num VALUES queries', () => {
    const sql = `VALUES ${VALUES_PLACEHOLDER} AS t(id_account, row_num)`;
    expect(suggestValuesInsertFormat(sql)).toBe('values-pairs');
  });

  it('suggests quoted commas for IN clauses', () => {
    const sql = `WHERE id IN (${VALUES_PLACEHOLDER})`;
    expect(suggestValuesInsertFormat(sql)).toBe('quoted-commas');
  });
});

describe('formatSqlValue', () => {
  it('quotes strings', () => {
    expect(formatSqlValue('0013k00002mjXdLAAU')).toBe("'0013k00002mjXdLAAU'");
  });

  it('quotes numeric-looking values', () => {
    expect(formatSqlValue('12345')).toBe("'12345'");
    expect(isNumericValue('12345')).toBe(true);
  });

  it('escapes single quotes in strings', () => {
    expect(formatSqlValue("O'Brien")).toBe("'O''Brien'");
  });
});

describe('buildValuesPairs', () => {
  it('builds mated pairs with row numbers', () => {
    const pairs = buildValuesPairs(['001abc', '002def'], 1);
    expect(pairs).toBe("('001abc', 1),\n            ('002def', 2)");
  });
});

describe('chunkValues', () => {
  it('splits into chunks of given size', () => {
    const values = Array.from({ length: 5 }, (_, i) => `id${i}`);
    const chunks = chunkValues(values, 2);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].startRow).toBe(1);
    expect(chunks[1].startRow).toBe(3);
    expect(chunks[2].startRow).toBe(5);
  });

  it('uses plain insert text by default', () => {
    const chunks = chunkValues(['a', 'b'], 10, 'plain');
    expect(chunks[0].insertText).toBe('a\nb');
  });
});

describe('applyValuesToQuery', () => {
  it('replaces values placeholder', () => {
    const sql = 'VALUES {{VALUES_PLACEHOLDER}}';
    expect(applyValuesToQuery(sql, "('a', 1)")).toBe("VALUES ('a', 1)");
  });

  it('replaces date placeholder when date is provided', () => {
    const sql = 'WHERE ds >= {{DATE_PLACEHOLDER}} AND id = {{VALUES_PLACEHOLDER}}';
    expect(applyValuesToQuery(sql, '12345', '2024-06-01')).toBe(
      "WHERE ds >= '2024-06-01' AND id = 12345",
    );
  });

  it('leaves date placeholder when date is omitted', () => {
    const sql = 'WHERE ds >= {{DATE_PLACEHOLDER}}';
    expect(applyValuesToQuery(sql, '')).toBe('WHERE ds >= {{DATE_PLACEHOLDER}}');
  });
});
