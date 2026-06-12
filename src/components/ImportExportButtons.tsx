import { useRef, type ChangeEvent } from 'react';
import { downloadQueriesJson, mergeQueries, parseImportFile, replaceQueries } from '../utils/queryImportExport';
import type { QueryItem } from '../types';

interface ImportExportProps {
  queries: QueryItem[];
  onImport: (queries: QueryItem[]) => void;
}

export function ImportExportButtons({ queries, onImport }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadQueriesJson(queries);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const imported = parseImportFile(text);

      const replace = confirm(
        `Import ${imported.length} quer${imported.length === 1 ? 'y' : 'ies'} from "${file.name}"?\n\nOK = Replace all current queries\nCancel = Merge (add new IDs only)`,
      );

      onImport(replace ? replaceQueries(imported) : mergeQueries(queries, imported));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="import-export">
      <button type="button" className="btn btn-sm btn-block" onClick={handleExport}>
        Export JSON
      </button>
      <button type="button" className="btn btn-sm btn-block" onClick={handleImportClick}>
        Import JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}
