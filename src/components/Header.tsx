import { Plus, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	selectedShell: string;
	availableShells: string[];
	onShellChange: (shell: string) => void;
}

export function Header({
	onCreateClick,
	selectedShell,
	availableShells,
	onShellChange,
}: HeaderProps) {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-code-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-3xl">
				{/* Logo and title */}
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center w-8 h-8 rounded-md bg-success/10 border border-success/20">
						<Terminal className="w-4 h-4 text-success" />
					</div>
					<h1 className="text-lg font-semibold font-[var(--font-mono)] tracking-tight flex items-center">
						<Select
							value={selectedShell}
							onValueChange={onShellChange}
						>
							<SelectTrigger className="border-none shadow-none bg-transparent! hover:bg-success/10! px-2 h-auto w-auto text-lg font-semibold text-success focus:ring-0 focus-visible:ring-0 gap-1 mr-2 [&>svg]:text-success">
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
						className="gap-2 bg-success hover:bg-success/90 text-black font-medium"
					>
						<Plus className="w-4 h-4" />
						Create Snippet
					</Button>
				</div>
			</div>

			{/* Subtle glow line */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-success/30 to-transparent" />
		</header>
	);
}
