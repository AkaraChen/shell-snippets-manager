import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragHandleProps {
  className?: string;
}

export function DragHandle({ className }: DragHandleProps) {
  return (
    <div
      className={cn(
        'cursor-grab active:cursor-grabbing',
        'text-muted-foreground hover:text-foreground',
        'transition-colors p-1 -ml-1 rounded',
        'hover:bg-accent/50',
        className
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <GripVertical className="w-4 h-4" />
    </div>
  );
}
