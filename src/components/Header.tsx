import { Plus, Terminal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { HelpButton } from "./HelpButton";
import { SyncButton } from "./SyncButton";

function capitalizeShellName(shell: string): string {
	const specialCases: Record<string, string> = {
		bash: "Bash",
		zsh: "Zsh",
		fish: "Fish",
	};
	return (
		specialCases[shell] ?? shell.charAt(0).toUpperCase() + shell.slice(1)
	);
}

interface HeaderProps {
	onCreateClick: () => void;
	createLabel?: string;
	selectedShell?: string;
	availableShells?: string[];
	onShellChange?: (shell: string) => void;
	snippetCount?: number;
	aliasCount?: number;
	environmentCount?: number;
}

export function Header({
	onCreateClick,
	createLabel = "Create",
	selectedShell,
	availableShells,
	onShellChange,
	snippetCount,
	aliasCount,
	environmentCount,
}: HeaderProps) {
	const [location] = useLocation();
	const showShellSelector = !!selectedShell && !!availableShells && !!onShellChange;

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-3xl">
				{/* Logo and title */}
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted border border-border">
						<Terminal className="w-4 h-4 text-muted-foreground" />
					</div>
					<h1 className="text-lg font-semibold font-[var(--font-mono)] tracking-tight flex items-center">
						{showShellSelector ? (
							<Select
								value={selectedShell}
								onValueChange={onShellChange}
							>
								<SelectTrigger className="border-none shadow-none bg-transparent! px-2 h-auto w-auto text-lg font-semibold text-foreground focus:ring-0 focus-visible:ring-0 gap-1 mr-2 [&>svg]:text-muted-foreground">
									<SelectValue>
										{capitalizeShellName(selectedShell)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{availableShells.map((shell) => (
										<SelectItem
											key={shell}
											value={shell}
											className="font-[var(--font-mono)]"
										>
											{capitalizeShellName(shell)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<span className="text-foreground mr-2 px-2">
								Shell
							</span>
						)}
						<span className="text-foreground">
							Snippets Manager
						</span>
					</h1>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					<SyncButton />
					<HelpButton />
					<Button
						onClick={onCreateClick}
						size="sm"
						className="gap-2 font-medium"
					>
						<Plus className="w-4 h-4" />
						{createLabel}
					</Button>
				</div>
			</div>

			{/* Navigation tabs */}
			<div className="container mx-auto px-4 max-w-3xl">
				<nav className="flex gap-4 -mb-px">
					<Link
						href="/"
						className={cn(
							"px-1 py-2 text-sm font-(--font-mono) border-b-2 transition-colors",
							location === "/"
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
						)}
					>
						Snippets
						{snippetCount != null && (
							<span className="ml-1.5 text-xs opacity-70">{snippetCount}</span>
						)}
					</Link>
					<Link
						href="/aliases"
						className={cn(
							"px-1 py-2 text-sm font-(--font-mono) border-b-2 transition-colors",
							location === "/aliases"
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
						)}
					>
						Aliases
						{aliasCount != null && (
							<span className="ml-1.5 text-xs opacity-70">{aliasCount}</span>
						)}
					</Link>
					<Link
						href="/environments"
						className={cn(
							"px-1 py-2 text-sm font-(--font-mono) border-b-2 transition-colors",
							location === "/environments"
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
						)}
					>
						Environments
						{environmentCount != null && (
							<span className="ml-1.5 text-xs opacity-70">{environmentCount}</span>
						)}
					</Link>
				</nav>
			</div>

		</header>
	);
}
