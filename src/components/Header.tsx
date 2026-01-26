import { Terminal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onCreateClick: () => void;
}

export function Header({ onCreateClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--code-border)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--terminal-green)]/10 border border-[var(--terminal-green)]/20">
            <Terminal className="w-4 h-4 text-[var(--terminal-green)]" />
          </div>
          <h1 className="text-lg font-semibold font-[var(--font-mono)] tracking-tight">
            <span className="text-[var(--terminal-green)]">Shell</span>
            <span className="text-foreground"> Snippets Manager</span>
          </h1>
        </div>

        {/* Create button */}
        <Button
          onClick={onCreateClick}
          size="sm"
          className="gap-2 bg-[var(--terminal-green)] hover:bg-[var(--terminal-green)]/90 text-black font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Snippet
        </Button>
      </div>

      {/* Subtle glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--terminal-green)]/30 to-transparent" />
    </header>
  );
}
