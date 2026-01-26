import type { ShellType } from '@/types/snippet';
import { cn } from '@/lib/utils';

interface ShellTypeBadgeProps {
  shellType: ShellType;
  className?: string;
}

const shellConfig: Record<ShellType, { label: string; colorClass: string }> = {
  bash: {
    label: 'bash',
    colorClass: 'bg-[var(--terminal-green)]/15 text-[var(--terminal-green)] border-[var(--terminal-green)]/30',
  },
  zsh: {
    label: 'zsh',
    colorClass: 'bg-[var(--terminal-cyan)]/15 text-[var(--terminal-cyan)] border-[var(--terminal-cyan)]/30',
  },
  fish: {
    label: 'fish',
    colorClass: 'bg-[var(--terminal-yellow)]/15 text-[var(--terminal-yellow)] border-[var(--terminal-yellow)]/30',
  },
  sh: {
    label: 'sh',
    colorClass: 'bg-[var(--terminal-dim)]/15 text-[var(--terminal-dim)] border-[var(--terminal-dim)]/30',
  },
  powershell: {
    label: 'pwsh',
    colorClass: 'bg-[var(--terminal-purple)]/15 text-[var(--terminal-purple)] border-[var(--terminal-purple)]/30',
  },
};

export function ShellTypeBadge({ shellType, className }: ShellTypeBadgeProps) {
  const config = shellConfig[shellType];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
        'font-[var(--font-mono)] tracking-tight',
        config.colorClass,
        className
      )}
    >
      {config.label}
    </span>
  );
}
