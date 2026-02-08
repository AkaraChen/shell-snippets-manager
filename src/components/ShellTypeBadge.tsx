import { cn } from "@/lib/utils";
import type { ShellType } from "@/types/snippet";

interface ShellTypeBadgeProps {
	shellType: ShellType;
	className?: string;
}

const shellConfig: Record<ShellType, { label: string; colorClass: string }> = {
	bash: {
		label: "bash",
		colorClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
	},
	zsh: {
		label: "zsh",
		colorClass: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
	},
	fish: {
		label: "fish",
		colorClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
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
