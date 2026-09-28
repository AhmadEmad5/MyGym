import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

export function moveItemToIndex<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function moveItemById<T>(items: T[], id: string, delta: number): T[] {
  const from = items.findIndex(item => (item as { id?: string }).id === id);
  if (from < 0) return items;
  return moveItemToIndex(items, from, from + delta);
}

export function moveItemToEdge<T>(items: T[], id: string, edge: 'start' | 'end'): T[] {
  const from = items.findIndex(item => (item as { id?: string }).id === id);
  if (from < 0) return items;
  return moveItemToIndex(items, from, edge === 'start' ? 0 : items.length - 1);
}

export type SortableHandleProps = {
  'data-sortable-handle': 'true';
  'aria-label': string;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
};

type SortableOptions = {
  ids: string[];
  onMove: (fromId: string, toId: string) => void;
  describe?: (id: string) => string;
  label: string;
  moveUpLabel: string;
  moveDownLabel: string;
  moveToStartLabel: string;
  moveToEndLabel: string;
  grabbedLabel: string;
  droppedLabel: string;
};

export function useSortableList({
  ids,
  onMove,
  describe,
  label,
  moveUpLabel,
  moveDownLabel,
  moveToStartLabel,
  moveToEndLabel,
  grabbedLabel,
  droppedLabel
}: SortableOptions) {
  const containerRef = useRef<HTMLElement | null>(null);
  const setContainer = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const pointerActiveRef = useRef(false);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    ids.forEach((id, index) => map.set(id, index));
    return map;
  }, [ids]);

  const describeItem = useCallback(
    (id: string) => (describe ? describe(id) : label),
    [describe, label]
  );

  const commit = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      onMove(fromId, toId);
      const nextIndex = indexById.get(toId) ?? 0;
      setAnnouncement(
        `${describeItem(fromId)} → ${nextIndex + 1} / ${ids.length} (${moveUpLabel}/${moveDownLabel})`
      );
    },
    [ids.length, indexById, onMove, describeItem, moveUpLabel, moveDownLabel]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, id: string) => {
      const index = indexById.get(id);
      if (index === undefined) return;
      const total = ids.length;
      let target = -1;
      if (event.key === 'ArrowUp') target = index - 1;
      else if (event.key === 'ArrowDown') target = index + 1;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = total - 1;
      else return;
      event.preventDefault();
      const bounded = Math.max(0, Math.min(total - 1, target));
      if (bounded === index) {
        setAnnouncement(`${describeItem(id)} — ${index + 1} / ${total}`);
        return;
      }
      const targetId = ids[bounded];
      commit(id, targetId);
      window.requestAnimationFrame(() => {
        const next = containerRef.current?.querySelector<HTMLElement>(
          `[data-sortable-id="${CSS.escape(targetId)}"] [data-sortable-handle="true"]`
        );
        next?.focus();
      });
    },
    [commit, describeItem, ids, indexById]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>, id: string) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerActiveRef.current = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        pointerActiveRef.current = false;
        return;
      }
      setDragId(id);
      setOverId(id);
      setAnnouncement(`${grabbedLabel}: ${describeItem(id)}`);
    },
    [describeItem, grabbedLabel]
  );

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!pointerActiveRef.current) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const item = target?.closest<HTMLElement>('[data-sortable-id]');
    const nextId = item?.getAttribute('data-sortable-id') ?? null;
    if (nextId && nextId !== overId) setOverId(nextId);
  }, [overId]);

  const handlePointerUp = useCallback(() => {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    const from = dragId;
    const to = overId;
    setDragId(null);
    setOverId(null);
    if (from && to && from !== to) {
      commit(from, to);
    } else if (from) {
      setAnnouncement(`${droppedLabel}: ${describeItem(from)}`);
    }
  }, [commit, describeItem, dragId, droppedLabel, overId]);

  const handlePointerCancel = useCallback(() => {
    pointerActiveRef.current = false;
    setDragId(null);
    setOverId(null);
    setAnnouncement('');
  }, []);

  const itemClassName = useCallback(
    (id: string) => {
      if (dragId === id) return 'is-dragging';
      if (overId === id && dragId && dragId !== id) return 'is-drop-target';
      return '';
    },
    [dragId, overId]
  );

  const getHandleProps = useCallback(
    (id: string): SortableHandleProps => ({
      'data-sortable-handle': 'true' as const,
      'aria-label': describeItem(id),
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleKeyDown(event, id),
      onPointerDown: (event: PointerEvent<HTMLElement>) => handlePointerDown(event, id),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel
    }),
    [describeItem, handleKeyDown, handlePointerCancel, handlePointerDown, handlePointerMove, handlePointerUp]
  );

  return {
    containerRef,
    setContainer,
    dragId,
    overId,
    announcement,
    itemClassName,
    getHandleProps,
    moveUpLabel,
    moveDownLabel,
    moveToStartLabel,
    moveToEndLabel
  };
}
