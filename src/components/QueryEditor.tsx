import { useCallback, useEffect, useRef, useState } from 'react';
import type { QueryItem, QueryTarget } from '../types';
import { DATAKO_URL, DATAKO_PROMPT_PLACEHOLDER, DATE_PLACEHOLDER, SQL_EDITOR_PLACEHOLDER, SQLLAB_URL, VALUES_PLACEHOLDER } from '../types';
import { CopyButton } from './CopyButton';
import { ValuesWorkspace } from './ValuesWorkspace';

interface QueryEditorProps {
  query: QueryItem;
  onSave: (query: QueryItem) => void;
  onDelete: (id: string) => void;
  onCopied: () => void;
}

function truncateNotes(text: string, max = 72): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

export function QueryEditor({ query, onSave, onDelete, onCopied }: QueryEditorProps) {
  const [draft, setDraft] = useState(query);
  const [dirty, setDirty] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(() => !query.notes.trim());
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const adjustNotesHeight = useCallback(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    setDraft(query);
    setDirty(false);
    setNotesExpanded(!query.notes.trim());
  }, [query.id]);

  useEffect(() => {
    const expanded = !draft.notes.trim() || notesExpanded;
    if (!expanded) return;
    requestAnimationFrame(adjustNotesHeight);
  }, [draft.notes, notesExpanded, adjustNotesHeight]);

  const update = useCallback(<K extends keyof QueryItem>(key: K, value: QueryItem[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'notes' && typeof value === 'string') {
        if (!value.trim()) setNotesExpanded(true);
      }
      return next;
    });
    setDirty(true);
  }, []);

  const handleSave = () => {
    onSave({ ...draft, updatedAt: new Date().toISOString() });
    setDirty(false);
    if (draft.notes.trim()) setNotesExpanded(false);
  };

  const isDatako = draft.target === 'datako';
  const promptLabel = isDatako ? 'Initial prompt' : 'SQL query';
  const copyLabel = isDatako ? 'Copy prompt' : 'Copy query';
  const sqlPlaceholder = isDatako ? DATAKO_PROMPT_PLACEHOLDER : SQL_EDITOR_PLACEHOLDER;
  const hasCopyableSql = draft.sql.trim().length > 0;
  const hasNotes = draft.notes.trim().length > 0;
  const showNotesEditor = !hasNotes || notesExpanded;

  return (
    <div className="panel">
      <div className="panel-top">
        <div className="panel-top-row field-row">
          <div className="field panel-top-name">
            <label htmlFor="query-name">Name</label>
            <input
              id="query-name"
              type="text"
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Get Emails From Salesforce ID"
            />
          </div>
          <div className="field panel-top-target">
            <label htmlFor="query-target">Default target</label>
            <div className="target-with-link">
              <select
                id="query-target"
                value={draft.target}
                onChange={(e) => update('target', e.target.value as QueryTarget)}
              >
                <option value="sqllab">SQLLab (Superset)</option>
                <option value="datako">Datako</option>
              </select>
              {draft.target === 'sqllab' ? (
                <a
                  className="btn btn-sm target-open-link"
                  href={SQLLAB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open SQLLab ↗
                </a>
              ) : (
                <a
                  className="btn btn-sm target-open-link"
                  href={DATAKO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Datako ↗
                </a>
              )}
            </div>
          </div>
          {dirty && (
            <button type="button" className="btn btn-primary panel-top-save" onClick={handleSave}>
              Save
            </button>
          )}
        </div>

        <div className="panel-top-meta">
          <div className="panel-header-badges">
            {draft.hasValuesPlaceholder && (
              <span className="badge badge-helper">VALUES helper</span>
            )}
            {draft.hasValuesPlaceholder && draft.hasDatePlaceholder && (
              <span className="badge badge-helper">Date filter</span>
            )}
            <span className="badge">{draft.target === 'sqllab' ? 'SQLLab' : 'Datako'}</span>
          </div>
        </div>

        <div className={`panel-notes${hasNotes ? ' panel-notes--has-content' : ''}`}>
          {hasNotes && (
            <button
              type="button"
              className="panel-notes-toggle"
              onClick={() => setNotesExpanded((open) => !open)}
              aria-expanded={notesExpanded}
            >
              <span className="panel-notes-toggle-label">
                Notes {notesExpanded ? '▾' : '▸'}
              </span>
              {!notesExpanded && (
                <span className="panel-notes-preview">{truncateNotes(draft.notes)}</span>
              )}
            </button>
          )}
          {showNotesEditor && (
            <div className="panel-notes-editor">
              {!hasNotes && <label htmlFor="query-notes">Notes (optional)</label>}
              <textarea
                ref={notesRef}
                id="query-notes"
                rows={1}
                value={draft.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder={
                  isDatako
                    ? 'Usage notes for this Datako prompt.'
                    : 'Paste Salesforce account IDs into the VALUES helper, then copy the full query.'
                }
              />
            </div>
          )}
        </div>
      </div>

      {!isDatako && (
        <div className="field">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.hasValuesPlaceholder}
              onChange={(e) => update('hasValuesPlaceholder', e.target.checked)}
            />
            Query uses <code>{VALUES_PLACEHOLDER}</code> for dynamic values
          </label>
          {draft.hasValuesPlaceholder && (
            <>
              <p className="placeholder-hint">
                Include <code>{VALUES_PLACEHOLDER}</code> in your SQL where values should
                be inserted. Use the format buttons in the VALUES helper to choose plain,
                quoted, comma-separated, or SQL pair style.
              </p>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.hasDatePlaceholder ?? false}
                  onChange={(e) => update('hasDatePlaceholder', e.target.checked)}
                />
                Query uses <code>{DATE_PLACEHOLDER}</code> for a date filter
              </label>
              {draft.hasDatePlaceholder && (
                <p className="placeholder-hint">
                  Include <code>{DATE_PLACEHOLDER}</code> in your SQL (e.g.{' '}
                  <code>ds &gt;= {DATE_PLACEHOLDER}</code>). Set the date in the VALUES
                  helper.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {draft.hasValuesPlaceholder && !isDatako ? (
        <div className="query-workspace">
          <div className="query-workspace-col">
            <label htmlFor="query-sql" className="workspace-label">
              {promptLabel}
            </label>
            <textarea
              id="query-sql"
              className="sql-editor sql-editor--paired"
              value={draft.sql}
              onChange={(e) => update('sql', e.target.value)}
              placeholder={sqlPlaceholder}
              spellCheck={false}
            />
          </div>
          <ValuesWorkspace
            queryId={draft.id}
            sql={draft.sql}
            hasDatePlaceholder={draft.hasDatePlaceholder ?? false}
            onCopied={onCopied}
          />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="query-sql">{promptLabel}</label>
          <textarea
            id="query-sql"
            className="sql-editor"
            value={draft.sql}
            onChange={(e) => update('sql', e.target.value)}
            placeholder={sqlPlaceholder}
            spellCheck={false}
          />
        </div>
      )}

      <div className="action-bar">
        {!draft.hasValuesPlaceholder && hasCopyableSql && (
          <CopyButton text={draft.sql} label={copyLabel} onCopied={onCopied} />
        )}
        {dirty && (
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save changes
          </button>
        )}
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => {
            if (confirm(`Delete "${draft.name}"?`)) onDelete(draft.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
