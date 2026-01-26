import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { SnippetItem } from './SnippetItem';
import type { Snippet } from '@/types/snippet';
import { cn } from '@/lib/utils';

const ITEM_TYPE = 'SNIPPET';

interface DragItem {
  id: number;
  index: number;
  originalIndex: number;
}

interface DraggableSnippetItemProps {
  snippet: Snippet;
  index: number;
  onToggle: (id: number) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: number) => void;
  moveSnippet: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
}

export function DraggableSnippetItem({
  snippet,
  index,
  onToggle,
  onEdit,
  onDelete,
  moveSnippet,
  onDragEnd,
}: DraggableSnippetItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >({
    type: ITEM_TYPE,
    item: () => ({ id: snippet.id, index, originalIndex: index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        onDragEnd(item.originalIndex, item.index);
      } else {
        // Dropped outside - revert to original position
        moveSnippet(item.index, item.originalIndex);
      }
    },
  });

  const [{ handlerId, isOver }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null; isOver: boolean }
  >({
    accept: ITEM_TYPE,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
      isOver: monitor.isOver(),
    }),
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY =
        (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Time to actually perform the action
      moveSnippet(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  // Combine drag preview and drop refs on the container
  preview(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn(
        'transition-all duration-150',
        isDragging && 'opacity-40 scale-[0.98]',
        isOver && !isDragging && 'ring-2 ring-success/50'
      )}
    >
      <SnippetItem
        snippet={snippet}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
        dragRef={drag}
      />
    </div>
  );
}
