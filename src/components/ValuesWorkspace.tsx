import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  convertListFormat,
  LIST_FORMAT_OPTIONS,
  type ListFormat,
} from '../utils/listFormat';
import {
  applyValuesToQuery,
  chunkValues,
  parseValuesInput,
  suggestValuesInsertFormat,
} from '../utils/valuesFormatter';
import { CopyButton } from './CopyButton';

interface ValuesWorkspaceProps {
  queryId: string;
  sql: string;
  hasDatePlaceholder: boolean;
  onCopied?: () => void;
}

export function ValuesWorkspace({
  queryId,
  sql,
  hasDatePlaceholder,
  onCopied,
}: ValuesWorkspaceProps) {
  const [input, setInput] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [insertFormat, setInsertFormat] = useState<ListFormat>('plain');
  const [date, setDate] = useState('');

  useEffect(() => {
    setInput('');
    setInsertFormat('plain');
    setDate('');
  }, [queryId]);

  const suggestedFormat = useMemo(() => suggestValuesInsertFormat(sql), [sql]);
  const values = useMemo(() => parseValuesInput(input), [input]);
  const chunks = useMemo(
    () => chunkValues(values, chunkSize, insertFormat),
    [values, chunkSize, insertFormat],
  );

  const handleFormatChange = useCallback(
    (nextFormat: ListFormat) => {
      setInsertFormat(nextFormat);
      setInput(convertListFormat(input, nextFormat));
    },
    [input],
  );

  return (
    <div className="query-workspace-side">
      <div className="query-workspace-col query-workspace-col--helper">
        <label htmlFor="values-input" className="workspace-label">
          VALUES Helper
        </label>
        <div className="values-helper">
          <p className="values-helper-desc">
            Paste values in any format, pick an output style, then copy into the query.
          </p>

          <div className="values-helper-toolbar">
            <label htmlFor="chunk-size" className="values-helper-toolbar-label">
              Max / chunk
            </label>
            <input
              id="chunk-size"
              type="number"
              min={1}
              max={10000}
              value={chunkSize}
              onChange={(e) => setChunkSize(Math.max(1, Number(e.target.value) || 1000))}
            />
            {values.length > 0 && (
              <span className="values-helper-toolbar-meta">
                {values.length} value{values.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="values-helper-formats" role="group" aria-label="Output format">
            {LIST_FORMAT_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`values-helper-format${insertFormat === id ? ' active' : ''}`}
                onClick={() => handleFormatChange(id)}
                aria-pressed={insertFormat === id}
              >
                {label}
              </button>
            ))}
          </div>

          {suggestedFormat && suggestedFormat !== insertFormat && (
            <p className="values-helper-hint">
              This query may work best with{' '}
              <button
                type="button"
                className="values-helper-hint-link"
                onClick={() => handleFormatChange(suggestedFormat)}
              >
                {LIST_FORMAT_OPTIONS.find((f) => f.id === suggestedFormat)?.label}
              </button>
              .
            </p>
          )}

          {hasDatePlaceholder && (
            <div className="values-helper-date">
              <label htmlFor="query-date" className="values-helper-toolbar-label">
                Date filter
              </label>
              <input
                id="query-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}

          <textarea
            id="values-input"
            className="values-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'HM3GHI789\nHM2DEF456\nHM1ABC123\n…'}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="query-workspace-col query-workspace-col--chunks">
        <label className="workspace-label">
          Chunks
          {values.length > 0 && (
            <span className="workspace-label-meta">
              {' '}
              — {values.length} values · {chunks.length} chunk
              {chunks.length !== 1 ? 's' : ''}
            </span>
          )}
        </label>
        <div className="values-chunks-panel">
          {values.length === 0 ? (
            <p className="chunks-empty">
              Paste values to generate copy-ready chunks for the query.
            </p>
          ) : (
            <>
              {chunks.map((chunk) => {
                const fullQuery = applyValuesToQuery(
                  sql,
                  chunk.insertText,
                  hasDatePlaceholder ? date : undefined,
                );
                return (
                  <div key={chunk.index} className="chunk-card">
                    <div className="chunk-header">
                      <span>
                        Chunk {chunk.index} — rows {chunk.startRow}–{chunk.endRow} (
                        {chunk.count})
                      </span>
                      <div className="chunk-actions">
                        <CopyButton
                          text={chunk.insertText}
                          label="Copy values"
                          onCopied={onCopied}
                        />
                        <CopyButton
                          text={fullQuery}
                          label="Copy query"
                          onCopied={onCopied}
                        />
                      </div>
                    </div>
                    <div className="chunk-preview">{chunk.insertText}</div>
                  </div>
                );
              })}

              {chunks.length > 1 && (
                <p className="values-helper-desc values-helper-footnote">
                  Run each chunk as a separate query in SQLLab (max {chunkSize} values
                  each).
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
