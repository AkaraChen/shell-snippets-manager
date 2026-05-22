import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import useSWR from "swr";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PanelRightClose, PanelRightOpen, Play, Save } from "lucide-react";
import { snippetApi, aliasApi } from "@/api/snippets";
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
import { useUpdateSnippet } from "@/hooks/useUpdateSnippet";
import { useUpdateAlias } from "@/hooks/useUpdateAlias";
import { useShellInfo } from "@/hooks/useShellInfo";
import { cn } from "@/lib/utils";
import type { AliasResponse, Snippet } from "@/types/snippet";

function capitalizeShellName(shell: string): string {
	const specialCases: Record<string, string> = {
		bash: "Bash",
		zsh: "Zsh",
		fish: "Fish",
	};
	return specialCases[shell] ?? shell.charAt(0).toUpperCase() + shell.slice(1);
}

function isEditableContextMenuTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(
		target.closest(
			'input, textarea, select, [contenteditable="true"], .cm-editor, .xterm',
		),
	);
}

function useEditData(tab: string, editId: number | null) {
	const { data: snippetData } = useSWR<Snippet>(
		tab === "snippet" && editId ? `edit-snippet-${editId}` : null,
		() => snippetApi.getById(editId!),
		{ suspense: true },
	);
	const { data: aliasData } = useSWR<AliasResponse>(
		tab === "alias" && editId ? `edit-alias-${editId}` : null,
		() => aliasApi.getById(editId!),
		{ suspense: true },
	);
	return tab === "snippet" ? snippetData : aliasData;
}

function CreateContent() {
	const params = new URLSearchParams(window.location.search);
	const initialTab = params.get("tab") === "alias" ? "alias" : "snippet";
	const editId = params.get("editId") ? Number(params.get("editId")) : null;
	const isEditMode = editId != null;

	const editData = useEditData(initialTab, editId);

	const { available_shells, default_shell } = useShellInfo();
	const createSnippet = useCreateSnippet();
	const createAlias = useCreateAlias();
	const updateSnippet = useUpdateSnippet();
	const updateAlias = useUpdateAlias();

	const terminalRef = useRef<TerminalHandle>(null);
	const snippetNameRef = useRef<HTMLInputElement>(null);
	const aliasNameRef = useRef<HTMLInputElement>(null);
	const [activeTab, setActiveTab] = useState(initialTab);
	const [terminalOpen, setTerminalOpen] = useState(() => {
		return localStorage.getItem("ssm.editor.terminalOpen") === "true";
	});
	const [status, setStatus] = useState("");

	// Snippet form state — pre-populate from editData when editing
	const snippetEdit = isEditMode && initialTab === "snippet" ? (editData as Snippet) : null;
	const [snippetName, setSnippetName] = useState(snippetEdit?.name ?? "");
	const [snippetContent, setSnippetContent] = useState(snippetEdit?.content ?? "");
	const [snippetShell, setSnippetShell] = useState(snippetEdit?.shell_type ?? default_shell);
	const [snippetDescription, setSnippetDescription] = useState(snippetEdit?.description ?? "");
	const [showSnippetDesc, setShowSnippetDesc] = useState(!!snippetEdit?.description);

	// Alias form state — pre-populate from editData when editing
	const aliasEdit = isEditMode && initialTab === "alias" ? (editData as AliasResponse) : null;
	const [aliasName, setAliasName] = useState(aliasEdit?.name ?? "");
	const [aliasCommand, setAliasCommand] = useState(aliasEdit?.command ?? "");
	const [aliasDescription, setAliasDescription] = useState(aliasEdit?.description ?? "");
	const [showAliasDesc, setShowAliasDesc] = useState(!!aliasEdit?.description);

	const sortedShells = useMemo(() => {
		const others = available_shells
			.filter((s) => s !== default_shell)
			.sort();
		return [default_shell, ...others];
	}, [available_shells, default_shell]);

	const handleRun = () => {
		const code = activeTab === "snippet" ? snippetContent : aliasCommand;
		if (code.trim() && terminalRef.current) {
			setTerminalOpen(true);
			terminalRef.current.runCode(code);
			setStatus("Running");
		}
	};

	const handleSave = async () => {
		setStatus("");
		if (activeTab === "snippet") {
			const name = snippetName.trim();
			const content = snippetContent.trim();
			if (!name || !content) {
				setStatus("Name and content are required");
				return;
			}
			if (isEditMode) {
				await updateSnippet.mutateAsync({
					id: editId,
					updates: {
						name,
						content,
						shell_type: snippetShell,
						description: snippetDescription.trim() || null,
					},
				});
				setStatus("Snippet updated");
			} else {
				await createSnippet.mutateAsync({
					name,
					content,
					shell_type: snippetShell,
					description: snippetDescription.trim() || null,
				});
				setStatus("Snippet created");
			}
		} else {
			const name = aliasName.trim();
			const command = aliasCommand.trim();
			if (!name || !command) {
				setStatus("Name and command are required");
				return;
			}
			if (isEditMode) {
				await updateAlias.mutateAsync({
					id: editId,
					updates: {
						name,
						command,
						description: aliasDescription.trim() || null,
					},
				});
				setStatus("Alias updated");
			} else {
				await createAlias.mutateAsync({
					name,
					command,
					description: aliasDescription.trim() || null,
					shell_types: available_shells,
				});
				setStatus("Alias created");
			}
		}

		await emit("data-changed");
		await getCurrentWindow().close();
	};

	useEffect(() => {
		localStorage.setItem("ssm.editor.terminalOpen", String(terminalOpen));
	}, [terminalOpen]);

	useEffect(() => {
		const input = activeTab === "snippet" ? snippetNameRef.current : aliasNameRef.current;
		input?.focus();
		input?.select();
	}, [activeTab]);

	useEffect(() => {
		const onContextMenu = (event: MouseEvent) => {
			if (!isEditableContextMenuTarget(event.target)) {
				event.preventDefault();
			}
		};

		window.addEventListener("contextmenu", onContextMenu);
		return () => window.removeEventListener("contextmenu", onContextMenu);
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
				event.preventDefault();
				void handleSave();
			}
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "w") {
				event.preventDefault();
				void getCurrentWindow().close();
			}
			if (event.key === "Escape" && terminalOpen) {
				event.preventDefault();
				setTerminalOpen(false);
			}
			if (event.key === "Escape" && status) {
				event.preventDefault();
				setStatus("");
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	const isPending =
		createSnippet.isPending ||
		createAlias.isPending ||
		updateSnippet.isPending ||
		updateAlias.isPending;
	const canSave =
		activeTab === "snippet"
			? !!snippetName.trim() && !!snippetContent.trim()
			: !!aliasName.trim() && !!aliasCommand.trim();

	return (
		<div className="flex flex-col h-screen bg-background text-foreground" spellCheck={false}>
			{/* Top bar */}
			<header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-4" data-tauri-drag-region>
				{isEditMode ? (
					<span className="text-sm font-medium text-muted-foreground">
						Edit {activeTab === "snippet" ? "Snippet" : "Alias"}
					</span>
				) : (
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
				)}
				<div className="ml-auto flex items-center gap-2">
					{status && (
						<span className="max-w-[260px] truncate text-xs text-muted-foreground">
							{status}
						</span>
					)}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setTerminalOpen((open) => !open)}
						className="gap-1.5"
					>
						{terminalOpen ? (
							<PanelRightClose className="size-4" />
						) : (
							<PanelRightOpen className="size-4" />
						)}
						Terminal
					</Button>
					<Button
						onClick={handleSave}
						disabled={!canSave || isPending}
						size="sm"
						className="gap-1.5"
					>
						<Save className="size-4" />
						{isEditMode ? "Update" : "Save"}
					</Button>
				</div>
			</header>

			{/* Main split area */}
			<div className="flex flex-1 min-h-0">
				{/* Left: Editor panel */}
				<div className={cn("flex flex-col", terminalOpen ? "w-[58%] border-r border-border" : "w-full")}>
					{/* Form fields */}
					<div className="p-4 space-y-3 shrink-0 border-b border-border">
						{activeTab === "snippet" ? (
							<>
								<div className="flex gap-3">
									<div className="flex-1 space-y-1.5">
										<Label htmlFor="snippet-name">Name</Label>
										<Input
											ref={snippetNameRef}
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
										ref={aliasNameRef}
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
								className="gap-1.5"
								disabled={
									activeTab === "snippet"
										? !snippetContent.trim()
										: !aliasCommand.trim()
								}
							>
								<Play className="size-3.5" />
								Run
							</Button>
						</div>
					</div>
				</div>

				{/* Right: Terminal panel */}
				{terminalOpen && (
					<div className="w-[42%] p-2">
						<Terminal
							ref={terminalRef}
							shell={activeTab === "snippet" ? snippetShell : default_shell}
							className="h-full rounded-md overflow-hidden"
						/>
					</div>
				)}
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
