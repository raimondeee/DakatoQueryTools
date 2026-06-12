import type { QueryItem } from '../types';

/** Favorites first, then original array order within each group. */
export function sortQueriesForDisplay(queries: QueryItem[]): QueryItem[] {
  return [...queries]
    .map((q, index) => ({ q, index }))
    .sort((a, b) => {
      const af = a.q.favorite ?? false;
      const bf = b.q.favorite ?? false;
      if (af !== bf) return af ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ q }) => q);
}

/** Reorder after drag-drop on the sorted display list. */
export function reorderQueries(
  queries: QueryItem[],
  draggedId: string,
  targetId: string,
  position: 'before' | 'after',
): QueryItem[] {
  const sorted = sortQueriesForDisplay(queries);
  const fromIdx = sorted.findIndex((q) => q.id === draggedId);
  const toIdx = sorted.findIndex((q) => q.id === targetId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return queries;

  const nextIds = sorted.map((q) => q.id);
  nextIds.splice(fromIdx, 1);
  let insertAt = toIdx;
  if (fromIdx < toIdx) insertAt--;
  if (position === 'after') insertAt++;
  nextIds.splice(insertAt, 0, draggedId);

  const byId = new Map(queries.map((q) => [q.id, q]));
  return nextIds.map((id) => byId.get(id)!);
}
