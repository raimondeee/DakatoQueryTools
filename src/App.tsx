import { useCallback, useEffect, useRef, useState } from 'react';
import type { QueryItem } from './types';
import { loadQueries, saveQueries } from './storage';
import { QueryEditor } from './components/QueryEditor';
import { QueryList } from './components/QueryList';
import { ImportExportButtons } from './components/ImportExportButtons';

export default function App() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    loadQueries()
      .then((data) => {
        setQueries(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || skipSave.current) {
      skipSave.current = false;
      return;
    }

    saveQueries(queries).catch((err: Error) => setSaveError(err.message));
  }, [queries, loading]);

  const selected = queries.find((q) => q.id === selectedId) ?? null;

  const handleSave = useCallback((updated: QueryItem) => {
    setQueries((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setSaveError(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setQueries((prev) => {
      const next = prev.filter((q) => q.id !== id);
      setSelectedId((cur) => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
    setSaveError(null);
  }, []);

  const handleAdd = useCallback(() => {
    const now = new Date().toISOString();
    const item: QueryItem = {
      id: crypto.randomUUID(),
      name: 'New Query',
      sql: '',
      target: 'sqllab',
      hasValuesPlaceholder: false,
      hasDatePlaceholder: false,
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    setQueries((prev) => [...prev, item]);
    setSelectedId(item.id);
    setSaveError(null);
  }, []);

  const showToast = useCallback(() => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }, []);

  const handleImport = useCallback((imported: QueryItem[]) => {
    setQueries(imported);
    setSelectedId((cur) =>
      imported.some((q) => q.id === cur) ? cur : imported[0]?.id ?? null,
    );
    setSaveError(null);
  }, []);

  const handleReorder = useCallback((reordered: QueryItem[]) => {
    setQueries(reordered);
    setSaveError(null);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setQueries((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, favorite: !q.favorite, updatedAt: new Date().toISOString() } : q,
      ),
    );
    setSaveError(null);
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading queries…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="empty-state">
        <p>Could not load queries: {loadError}</p>
        <p className="placeholder-hint">Make sure you started the app with <code>npm run dev</code>.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-home-button"
            onClick={() => setSelectedId(null)}
            title="Clear selection"
          >
            <h1>Dakato Query Tools</h1>
          </button>
          <p>SQL templates for SQLLab &amp; Datako</p>
          <p className="storage-hint">Saved to <code>data/queries.json</code></p>
        </div>

        <QueryList
          queries={queries}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={handleReorder}
          onToggleFavorite={handleToggleFavorite}
          onCopied={showToast}
        />

        <div className="sidebar-footer">
          <button type="button" className="btn btn-primary btn-block" onClick={handleAdd}>
            + Add query
          </button>
          <ImportExportButtons queries={queries} onImport={handleImport} />
        </div>
      </aside>

      <main className="main">
        {saveError && (
          <div className="save-error-banner">
            Could not save: {saveError}
          </div>
        )}
        {selected ? (
          <QueryEditor
            key={selected.id}
            query={selected}
            onSave={handleSave}
            onDelete={handleDelete}
            onCopied={showToast}
          />
        ) : (
          <div className="empty-state">
            {queries.length === 0 ? (
              <>
                <p>No queries yet.</p>
                <button type="button" className="btn btn-primary" onClick={handleAdd}>
                  Add your first query
                </button>
              </>
            ) : (
              <>
                <p>Select a query from the sidebar, or add a new one.</p>
                <button type="button" className="btn btn-primary" onClick={handleAdd}>
                  + Add query
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {toast && <div className="copied-toast">Copied to clipboard</div>}
    </div>
  );
}
