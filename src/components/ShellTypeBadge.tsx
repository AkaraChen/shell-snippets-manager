import { cn } from "@/lib/utils";
import type { ShellType } from "@/types/snippet";

interface ShellTypeBadgeProps {
	shellType: ShellType;
	className?: string;
}

const shellConfig: Record<ShellType, { label: string; colorClass: string }> = {
	bash: {
		label: "bash",
		colorClass: "bg-muted text-muted-foreground border-border",
	},
	zsh: {
		label: "zsh",
		colorClass: "bg-muted text-muted-foreground border-border",
	},
	fish: {
		label: "fish",
		colorClass: "bg-muted text-muted-foreground border-border",
	},
};

export function ShellTypeBadge({ shellType, className }: ShellTypeBadgeProps) {
	const config = shellConfig[shellType];

	return (
		<span
			className={cn(
				"inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border",
				"font-[var(--font-mono)] tracking-tight",
				config.colorClass,
				className,
			)}
		>
			{config.label}
		</span>
	);
}
