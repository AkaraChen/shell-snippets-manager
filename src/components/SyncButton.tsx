import { Suspense } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useShellInfo } from '@/hooks/useShellInfo';
import { useSyncToShell, useSyncAllShells } from '@/hooks/useSync';
import { RefreshCw, Loader2, ChevronDown, Terminal } from 'lucide-react';

function capitalizeShellName(shell: string): string {
  const specialCases: Record<string, string> = {
    sh: 'POSIX sh',
    zsh: 'Zsh',
    bash: 'Bash',
    fish: 'Fish',
    ksh: 'Ksh',
    csh: 'Csh',
    tcsh: 'Tcsh',
    dash: 'Dash',
  };
  return specialCases[shell] ?? shell;
}

function SyncButtonContent() {
  const { available_shells, default_shell } = useShellInfo();
  const { mutate: syncToShell, isPending: isSyncingOne } = useSyncToShell();
  const { mutate: syncAll, isPending: isSyncingAll } = useSyncAllShells();

  const isPending = isSyncingOne || isSyncingAll;

  // Sort shells: default first, then alphabetically
  const sortedShells = [
    default_shell,
    ...available_shells.filter((s) => s !== default_shell).sort(),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="gap-2 border-code-border hover:border-success/50 hover:bg-success/5"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-[var(--font-mono)] text-xs">
          Sync snippets to shell
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => syncAll()}
          disabled={isPending}
          className="cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2 text-success" />
          <span className="font-[var(--font-mono)]">Sync All Shells</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {sortedShells.map((shell) => (
          <DropdownMenuItem
            key={shell}
            onClick={() => syncToShell(shell)}
            disabled={isPending}
            className="cursor-pointer"
          >
            <Terminal className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="font-[var(--font-mono)]">
              {capitalizeShellName(shell)}
              {shell === default_shell && (
                <span className="text-xs text-muted-foreground ml-1">(default)</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SyncButtonFallback() {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      className="gap-2 border-code-border"
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      Sync
      <ChevronDown className="w-3 h-3 opacity-50" />
    </Button>
  );
}

export function SyncButton() {
  return (
    <Suspense fallback={<SyncButtonFallback />}>
      <SyncButtonContent />
    </Suspense>
  );
}
