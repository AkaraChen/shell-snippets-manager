import { useRef, useState, useMemo, Suspense } from "react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Play, Save } from "lucide-react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/CodeEditor";
import { Terminal, type TerminalHandle } from "@/components/Terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAlias } from "@/hooks/useCreateAlias";
import { useCreateSnippet } from "@/hooks/useCreateSnippet";
import { useShellInfo } from "@/hooks/useShellInfo";

function capitalizeShellName(shell: string): string {
	const specialCases: Record<string, string> = {
		bash: "Bash",
		zsh: "Zsh",
		fish: "Fish",
	};
	return specialCases[shell] ?? shell.charAt(0).toUpperCase() + shell.slice(1);
}

function CreateContent() {
	const params = new URLSearchParams(window.location.search);
	const initialTab = params.get("tab") === "alias" ? "alias" : "snippet";

	const { available_shells, default_shell } = useShellInfo();
	const createSnippet = useCreateSnippet();
	const createAlias = useCreateAlias();

	const terminalRef = useRef<TerminalHandle>(null);
	const [activeTab, setActiveTab] = useState(initialTab);

	// Snippet form state
	const [snippetName, setSnippetName] = useState("");
	const [snippetContent, setSnippetContent] = useState("");
	const [snippetShell, setSnippetShell] = useState(default_shell);
	const [snippetDescription, setSnippetDescription] = useState("");
	const [showSnippetDesc, setShowSnippetDesc] = useState(false);

	// Alias form state
	const [aliasName, setAliasName] = useState("");
	const [aliasCommand, setAliasCommand] = useState("");
	const [aliasDescription, setAliasDescription] = useState("");
	const [showAliasDesc, setShowAliasDesc] = useState(false);

	const sortedShells = useMemo(() => {
		const others = available_shells
			.filter((s) => s !== default_shell)
			.sort();
		return [default_shell, ...others];
	}, [available_shells, default_shell]);

	const handleRun = () => {
		const code = activeTab === "snippet" ? snippetContent : aliasCommand;
		if (code.trim() && terminalRef.current) {
			terminalRef.current.runCode(code);
		}
	};

	const handleSave = async () => {
		if (activeTab === "snippet") {
			const name = snippetName.trim();
			const content = snippetContent.trim();
			if (!name || !content) {
				toast.error("Name and content are required");
				return;
			}
			await createSnippet.mutateAsync({
				name,
				content,
				shell_type: snippetShell,
				description: snippetDescription.trim() || null,
			});
			toast.success("Snippet created");
		} else {
			const name = aliasName.trim();
			const command = aliasCommand.trim();
			if (!name || !command) {
				toast.error("Name and command are required");
				return;
			}
			await createAlias.mutateAsync({
				name,
				command,
				description: aliasDescription.trim() || null,
				shell_types: available_shells,
			});
			toast.success("Alias created");
		}

		await emit("data-changed");
		await getCurrentWindow().close();
	};

	const isPending = createSnippet.isPending || createAlias.isPending;
	const canSave =
		activeTab === "snippet"
			? snippetName.trim() && snippetContent.trim()
			: aliasName.trim() && aliasCommand.trim();

	return (
		<div className="flex flex-col h-screen bg-background text-foreground">
			{/* Top bar */}
			<header className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0" data-tauri-drag-region>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList variant="line">
						<TabsTrigger value="snippet" className="text-sm font-medium">
							Snippet
						</TabsTrigger>
						<TabsTrigger value="alias" className="text-sm font-medium">
							Alias
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<Button
					onClick={handleSave}
					disabled={!canSave || isPending}
					size="sm"
					className="gap-2 bg-success hover:bg-success/90 text-black font-medium"
				>
					<Save className="w-4 h-4" />
					Save
				</Button>
			</header>

			{/* Main split area */}
			<div className="flex flex-1 min-h-0">
				{/* Left: Editor panel */}
				<div className="w-[55%] flex flex-col border-r border-border">
					{/* Form fields */}
					<div className="p-4 space-y-3 shrink-0 border-b border-border">
						{activeTab === "snippet" ? (
							<>
								<div className="flex gap-3">
									<div className="flex-1 space-y-1.5">
										<Label htmlFor="snippet-name">Name</Label>
										<Input
											id="snippet-name"
											placeholder="e.g., List all files"
											value={snippetName}
											onChange={(e) => setSnippetName(e.target.value)}
										/>
									</div>
									<div className="w-32 space-y-1.5">
										<Label>Shell</Label>
										<Select value={snippetShell} onValueChange={setSnippetShell}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{sortedShells.map((shell) => (
													<SelectItem key={shell} value={shell}>
														{capitalizeShellName(shell)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								{showSnippetDesc ? (
									<div className="space-y-1.5">
										<Label htmlFor="snippet-desc">Description</Label>
										<Textarea
											id="snippet-desc"
											placeholder="Optional description..."
											value={snippetDescription}
											onChange={(e) => setSnippetDescription(e.target.value)}
											onBlur={() => {
												if (!snippetDescription.trim()) setShowSnippetDesc(false);
											}}
											className="min-h-[60px]"
										/>
									</div>
								) : (
									<button
										type="button"
										onClick={() => setShowSnippetDesc(true)}
										className="text-xs text-muted-foreground hover:text-foreground transition-colors"
									>
										+ Add description
									</button>
								)}
							</>
						) : (
							<>
								<div className="space-y-1.5">
									<Label htmlFor="alias-name">Name</Label>
									<Input
										id="alias-name"
										placeholder="e.g., ll"
										value={aliasName}
										onChange={(e) => setAliasName(e.target.value)}
									/>
								</div>
								{showAliasDesc ? (
									<div className="space-y-1.5">
										<Label htmlFor="alias-desc">Description</Label>
										<Textarea
											id="alias-desc"
											placeholder="Optional description..."
											value={aliasDescription}
											onChange={(e) => setAliasDescription(e.target.value)}
											onBlur={() => {
												if (!aliasDescription.trim()) setShowAliasDesc(false);
											}}
											className="min-h-[60px]"
										/>
									</div>
								) : (
									<button
										type="button"
										onClick={() => setShowAliasDesc(true)}
										className="text-xs text-muted-foreground hover:text-foreground transition-colors"
									>
										+ Add description
									</button>
								)}
							</>
						)}
					</div>

					{/* Editor */}
					<div className="flex-1 flex flex-col min-h-0">
						<CodeEditor
							value={activeTab === "snippet" ? snippetContent : aliasCommand}
							onChange={activeTab === "snippet" ? setSnippetContent : setAliasCommand}
							placeholder={
								activeTab === "snippet"
									? "# Write your shell script here..."
									: "e.g., ls -la --color=auto"
							}
							className="flex-1 overflow-auto"
						/>
						{/* Run button bar */}
						<div className="flex justify-end px-4 py-2 border-t border-border shrink-0">
							<Button
								onClick={handleRun}
								size="sm"
								variant="outline"
								className="gap-2"
								disabled={
									activeTab === "snippet"
										? !snippetContent.trim()
										: !aliasCommand.trim()
								}
							>
								<Play className="w-3.5 h-3.5" />
								Run
							</Button>
						</div>
					</div>
				</div>

				{/* Right: Terminal panel */}
				<div className="w-[45%] p-2">
					<Terminal
						ref={terminalRef}
						shell={activeTab === "snippet" ? snippetShell : default_shell}
						className="h-full rounded-md overflow-hidden"
					/>
				</div>
			</div>
		</div>
	);
}

export function Create() {
	return (
		<Suspense fallback={<div className="h-screen bg-background" />}>
			<CreateContent />
		</Suspense>
	);
}
