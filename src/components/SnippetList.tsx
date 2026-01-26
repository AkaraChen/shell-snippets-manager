import { Accordion } from '@/components/ui/accordion';
import { SnippetItem } from './SnippetItem';
import type { Snippet } from '@/types/snippet';
import { Terminal, FileCode } from 'lucide-react';

interface SnippetListProps {
  snippets: Snippet[];
  loading: boolean;
  onToggle: (id: number) => void;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--code-bg)] border border-[var(--code-border)] flex items-center justify-center mb-4">
        <FileCode className="w-8 h-8 text-[var(--terminal-dim)]" />
      </div>
      <h3 className="text-lg font-[var(--font-mono)] text-foreground mb-2">
        No snippets yet
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Create your first shell snippet to get started. Your aliases, functions, and commands will appear here.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-[var(--code-border)] rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-5 bg-muted rounded" />
            <div className="w-48 h-5 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SnippetList({ snippets, loading, onToggle }: SnippetListProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (snippets.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <Terminal className="w-4 h-4" />
        <span className="text-sm font-[var(--font-mono)]">
          {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {snippets.map((snippet) => (
          <SnippetItem
            key={snippet.id}
            snippet={snippet}
            onToggle={onToggle}
          />
        ))}
      </Accordion>
    </div>
  );
}
