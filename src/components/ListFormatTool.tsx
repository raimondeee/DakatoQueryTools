import { useCallback, useMemo, useState } from 'react';
import { CopyButton } from './CopyButton';
import {
  convertListFormat,
  LIST_FORMAT_OPTIONS,
  type ListFormat,
  parseFormattedListValues,
} from '../utils/listFormat';

interface ListFormatToolProps {
  onCopied?: () => void;
}

export function ListFormatTool({ onCopied }: ListFormatToolProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<ListFormat>('plain');

  const values = useMemo(() => parseFormattedListValues(input), [input]);
  const output = useMemo(() => convertListFormat(input, format), [input, format]);

  const handleFormatChange = useCallback(
    (nextFormat: ListFormat) => {
      setFormat(nextFormat);
      setInput(convertListFormat(input, nextFormat));
    },
    [input],
  );

  return (
    <div className="list-format-tool">
      <button
        type="button"
        className="list-format-tool-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        List formatter {open ? '▾' : '▸'}
      </button>

      {open && (
        <div className="list-format-tool-body">
          <p className="list-format-tool-desc">
            Paste values in any format, then switch output style.
          </p>
          <textarea
            className="list-format-tool-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'724984367\n350840928\n47895236\n…'}
            spellCheck={false}
            rows={5}
          />
          <div className="list-format-tool-formats" role="group" aria-label="Output format">
            {LIST_FORMAT_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`list-format-tool-format${format === id ? ' active' : ''}`}
                onClick={() => handleFormatChange(id)}
                aria-pressed={format === id}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="list-format-tool-footer">
            <span className="list-format-tool-meta">
              {values.length > 0
                ? `${values.length} value${values.length === 1 ? '' : 's'}`
                : 'No values parsed'}
            </span>
            <CopyButton
              text={output}
              label="Copy output"
              className="btn btn-success btn-sm"
              onCopied={onCopied}
            />
          </div>
        </div>
      )}
    </div>
  );
}
