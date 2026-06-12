export type QueryTarget = 'sqllab' | 'datako';

export interface QueryItem {
  id: string;
  name: string;
  /** SQL text; newlines and indentation are preserved */
  sql: string;
  target: QueryTarget;
  /** When true, show the VALUES helper for {{VALUES_PLACEHOLDER}} */
  hasValuesPlaceholder: boolean;
  /** When true, show date input for {{DATE_PLACEHOLDER}} (requires hasValuesPlaceholder) */
  hasDatePlaceholder?: boolean;
  notes: string;
  /** Pinned to the top of the sidebar when true */
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const VALUES_PLACEHOLDER = '{{VALUES_PLACEHOLDER}}';

export const DATE_PLACEHOLDER = '{{DATE_PLACEHOLDER}}';

export const SQLLAB_URL = 'https://superset.a.musta.ch/sqllab/';
export const DATAKO_URL = 'https://datako.a.musta.ch/';

/** Shown in empty SQLLab query fields (not stored as value). */
export const SQL_EDITOR_PLACEHOLDER = '-- Paste your SQL here\nSELECT 1';

/** Shown in empty Datako prompt fields (not stored as value). */
export const DATAKO_PROMPT_PLACEHOLDER =
  'Enter the prompt to paste into Datako (e.g. your Geo Report instructions or CTA report template).';
