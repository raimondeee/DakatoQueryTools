import { describe, expect, it } from 'vitest';
import {
  convertListFormat,
  formatListValues,
  parseFormattedListValues,
  stripFormattedToken,
} from './listFormat';

const SAMPLE = [
  '724984367',
  '350840928',
  '47895236',
  '757060598',
  '554448636',
  '518559640',
  '479416670',
];

describe('stripFormattedToken', () => {
  it('removes trailing commas and quotes', () => {
    expect(stripFormattedToken("'724984367',")).toBe('724984367');
    expect(stripFormattedToken('724984367,')).toBe('724984367');
  });

  it('unescapes doubled single quotes', () => {
    expect(stripFormattedToken("'O''Brien',")).toBe("O'Brien");
  });
});

describe('parseFormattedListValues', () => {
  it('parses plain newline-separated values', () => {
    expect(parseFormattedListValues('724984367\n350840928')).toEqual([
      '724984367',
      '350840928',
    ]);
  });

  it('parses comma-separated lines', () => {
    expect(parseFormattedListValues('724984367,\n350840928,')).toEqual([
      '724984367',
      '350840928',
    ]);
  });

  it('parses quoted comma-separated values', () => {
    expect(parseFormattedListValues("'724984367',\n'350840928',")).toEqual([
      '724984367',
      '350840928',
    ]);
  });

  it('parses SQL values pairs', () => {
    expect(
      parseFormattedListValues(
        "('0013k00002mjXdLAAU', 1), ('0013k00002uidJxAAI', 2)",
      ),
    ).toEqual(['0013k00002mjXdLAAU', '0013k00002uidJxAAI']);
  });
});

describe('formatListValues', () => {
  it('formats plain lists', () => {
    expect(formatListValues(SAMPLE, 'plain')).toBe(SAMPLE.join('\n'));
  });

  it('formats comma lists', () => {
    expect(formatListValues(['724984367', '350840928'], 'commas')).toBe(
      '724984367,\n350840928,',
    );
  });

  it('formats quoted lists', () => {
    expect(formatListValues(['724984367', '350840928'], 'quoted')).toBe(
      "'724984367'\n'350840928'",
    );
  });

  it('formats quoted comma lists', () => {
    expect(formatListValues(['724984367', '350840928'], 'quoted-commas')).toBe(
      "'724984367',\n'350840928',",
    );
  });

  it('formats SQL values pairs', () => {
    expect(formatListValues(['001abc', '002def'], 'values-pairs')).toBe(
      "('001abc', 1), ('002def', 2)",
    );
  });
});

describe('convertListFormat', () => {
  it('round-trips between formats', () => {
    const plain = SAMPLE.join('\n');
    const quoted = convertListFormat(plain, 'quoted-commas');
    expect(convertListFormat(quoted, 'plain')).toBe(plain);
  });

  it('round-trips SQL values pairs to plain', () => {
    const pairs = "('001abc', 1), ('002def', 2)";
    expect(convertListFormat(pairs, 'plain')).toBe('001abc\n002def');
  });
});
