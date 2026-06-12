import { useMemo, useState } from 'react';
import type { QueryItem, QueryTarget } from '../types';
import { reorderQueries, sortQueriesForDisplay } from '../utils/queryOrder';
import { ListFormatTool } from './ListFormatTool';

type TargetFilter = 'all' | QueryTarget;

interface QueryListProps {
  queries: QueryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (queries: QueryItem[]) => void;
  onToggleFavorite: (id: string) => void;
  onCopied?: () => void;
}

export function QueryList({
  queries,
  selectedId,
  onSelect,
  onReorder,
  onToggleFavorite,
  onCopied,
}: QueryListProps) {
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState<TargetFilter>('all');
  const sorted = useMemo(() => sortQueriesForDisplay(queries), [queries]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sorted.filter((q) => {
      if (targetFilter !== 'all' && q.target !== targetFilter) return false;
      if (term && !q.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [sorted, search, targetFilter]);
  const reorderEnabled = !search.trim() && targetFilter === 'all';
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'before' | 'after';
  } | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!reorderEnabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!reorderEnabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDropTarget({ id, position });
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!reorderEnabled) return;
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) {
      handleDragEnd();
      return;
    }
    const position = dropTarget?.id === targetId ? dropTarget.position : 'before';
    onReorder(reorderQueries(queries, draggedId, targetId, position));
    handleDragEnd();
  };

  if (queries.length === 0) {
    return (
      <div className="query-list-panel">
        <div className="query-list-toolbar">
          <ListFormatTool onCopied={onCopied} />
        </div>
      </div>
    );
  }

  return (
    <div className="query-list-panel">
      <div className="query-list-toolbar">
        <input
          type="search"
          className="query-list-search"
          placeholder="Search titles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search query titles"
        />
        <div className="query-list-filters" role="group" aria-label="Filter by target">
          {(
            [
              ['all', 'All'],
              ['sqllab', 'SQLLab'],
              ['datako', 'Datako'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`query-list-filter${targetFilter === value ? ' active' : ''}`}
              onClick={() => setTargetFilter(value)}
              aria-pressed={targetFilter === value}
            >
              {label}
            </button>
          ))}
        </div>
        <ListFormatTool onCopied={onCopied} />
      </div>

      <div className="query-list">
        {filtered.length === 0 ? (
          <p className="query-list-empty">No queries match your search.</p>
        ) : (
          filtered.map((q) => {
        const isDragging = draggingId === q.id;
        const showDropBefore =
          dropTarget?.id === q.id && dropTarget.position === 'before';
        const showDropAfter =
          dropTarget?.id === q.id && dropTarget.position === 'after';

        return (
          <div
            key={q.id}
            className={`query-list-row${isDragging ? ' dragging' : ''}${showDropBefore ? ' drop-before' : ''}${showDropAfter ? ' drop-after' : ''}`}
            onDragOver={(e) => handleDragOver(e, q.id)}
            onDrop={(e) => handleDrop(e, q.id)}
          >
            <button
              type="button"
              className={`query-list-drag${reorderEnabled ? '' : ' disabled'}`}
              draggable={reorderEnabled}
              onDragStart={(e) => handleDragStart(e, q.id)}
              onDragEnd={handleDragEnd}
              title={reorderEnabled ? 'Drag to reorder' : 'Clear search and filters to reorder'}
              aria-label={`Reorder ${q.name}`}
              disabled={!reorderEnabled}
            >
              ⠿
            </button>
            <button
              type="button"
              className={`query-list-star${q.favorite ? ' favorite' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(q.id);
              }}
              title={q.favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={q.favorite ? `Unfavorite ${q.name}` : `Favorite ${q.name}`}
              aria-pressed={q.favorite ?? false}
            >
              {q.favorite ? '★' : '☆'}
            </button>
            <button
              type="button"
              className={`query-list-item${q.id === selectedId ? ' active' : ''}`}
              onClick={() => onSelect(q.id)}
            >
              <span className="query-list-item-name">{q.name}</span>
              <span className="query-list-item-meta">
                {q.hasValuesPlaceholder ? 'VALUES helper · ' : ''}
                {q.target === 'sqllab' ? 'SQLLab' : 'Datako'}
              </span>
            </button>
          </div>
        );
          })
        )}
      </div>
    </div>
  );
}
