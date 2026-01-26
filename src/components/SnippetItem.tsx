import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShellTypeBadge } from './ShellTypeBadge';
import { SnippetCodeBlock } from './SnippetCodeBlock';
import { DragHandle } from './DragHandle';
import type { Snippet } from '@/types/snippet';
import { cn } from '@/lib/utils';

interface SnippetItemProps {
  snippet: Snippet;
  onToggle: (id: number) => void;
  isDragging?: boolean;
  dragRef?: (element: HTMLElement | null) => void;
}

export function SnippetItem({ snippet, onToggle, isDragging, dragRef }: SnippetItemProps) {
  return (
    <AccordionItem
      value={`snippet-${snippet.id}`}
      className={cn(
        'border border-[var(--code-border)] rounded-lg mb-2 overflow-hidden',
        'bg-card/50 hover:bg-card/80 transition-colors',
        !snippet.enabled && 'opacity-60',
        isDragging && 'shadow-lg ring-2 ring-[var(--terminal-green)]/30'
      )}
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag handle - attach drag ref here */}
          <div ref={dragRef as React.Ref<HTMLDivElement>}>
            <DragHandle />
          </div>
          <ShellTypeBadge shellType={snippet.shell_type} />
          <span
            className={cn(
              'font-[var(--font-mono)] text-sm truncate',
              !snippet.enabled && 'line-through text-muted-foreground'
            )}
          >
            {snippet.name}
          </span>
          {!snippet.enabled && (
            <span className="text-xs text-muted-foreground">(disabled)</span>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Code block */}
          <SnippetCodeBlock content={snippet.content} shellType={snippet.shell_type} />

          {/* Description */}
          {snippet.description && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </span>
              <p className="text-sm text-foreground/80">{snippet.description}</p>
            </div>
          )}

          {/* Meta row: enabled toggle and tags */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
            {/* Enabled toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={snippet.enabled}
                onCheckedChange={() => onToggle(snippet.id)}
                className="data-[state=checked]:bg-[var(--terminal-green)]"
              />
              <span className="text-xs text-muted-foreground">
                {snippet.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Tags */}
            {snippet.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {snippet.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs font-[var(--font-mono)]"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      borderColor: tag.color ? `${tag.color}40` : undefined,
                      color: tag.color || undefined,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
