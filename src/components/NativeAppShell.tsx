import { confirm } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import {
	Braces,
	ChevronLeft,
	ChevronRight,
	FileCode,
	Hash,
	PanelRightClose,
	PanelRightOpen,
	Plus,
	RefreshCw,
	Search,
	Terminal as TerminalIcon,
	Trash2,
	Pencil,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type KeyboardEvent,
	type ReactNode,
} from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { syncApi } from "@/api/snippets";
import { CreateEnvironmentDialog } from "@/components/CreateEnvironmentDialog";
import { SnippetCodeBlock } from "@/components/SnippetCodeBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAliases } from "@/hooks/useAliases";
import { useEnvironments } from "@/hooks/useEnvironments";
import { useShellInfo } from "@/hooks/useShellInfo";
import { useSnippets } from "@/hooks/useSnippets";
import { openCreateWindow } from "@/lib/createWindow";
import { cn } from "@/lib/utils";
import type { Environment } from "@/types/environment";
import type { AliasResponse, Snippet } from "@/types/snippet";

type Section = "snippets" | "aliases" | "environments";
type ShellFilter = "all" | string;
type StatusTone = "idle" | "success" | "error" | "pending";

interface LayoutState {
	section: Section;
	shellFilter: ShellFilter;
	search: Record<Section, string>;
	selected: Partial<Record<Section, number>>;
	inspectorCollapsed: boolean;
}

interface StatusState {
	message: string;
	tone: StatusTone;
}

const LAYOUT_KEY = "ssm.layout.v1";

const defaultLayout: LayoutState = {
	section: "snippets",
	shellFilter: "all",
	search: {
		snippets: "",
		aliases: "",
		environments: "",
	},
	selected: {},
	inspectorCollapsed: false,
};

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(
		target.closest(
			'input, textarea, select, [contenteditable="true"], .cm-editor, .xterm',
		),
	);
}

function useDelayedFlag(value: boolean, delay = 200): boolean {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!value) {
			setVisible(false);
			return;
		}

		const timeout = window.setTimeout(() => setVisible(true), delay);
		return () => window.clearTimeout(timeout);
	}, [value, delay]);

	return visible;
}

function capitalizeShellName(shell: string): string {
	const specialCases: Record<string, string> = {
		bash: "Bash",
		zsh: "Zsh",
		fish: "Fish",
		all: "All",
	};
	return specialCases[shell] ?? shell.charAt(0).toUpperCase() + shell.slice(1);
}

function loadLayout(): LayoutState {
	try {
		const raw = localStorage.getItem(LAYOUT_KEY);
		if (!raw) return defaultLayout;
		const parsed = JSON.parse(raw) as Partial<LayoutState>;
		return {
			...defaultLayout,
			...parsed,
			search: { ...defaultLayout.search, ...parsed.search },
			selected: parsed.selected ?? {},
		};
	} catch {
		return defaultLayout;
	}
}

function itemMatches(value: string | null | undefined, query: string): boolean {
	return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof FileCode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-muted-foreground">
			<Icon className="size-8" />
			<div className="text-sm font-medium text-foreground">{title}</div>
			<p className="max-w-sm text-sm">{description}</p>
		</div>
	);
}

function InlineStatus({ status }: { status: StatusState }) {
	if (!status.message) return null;
	return (
		<div
			className={cn(
				"truncate text-xs",
				status.tone === "success" && "text-success",
				status.tone === "error" && "text-destructive",
				status.tone === "pending" && "text-muted-foreground",
				status.tone === "idle" && "text-muted-foreground",
			)}
		>
			{status.message}
		</div>
	);
}

function SidebarButton({
	active,
	icon: Icon,
	label,
	count,
	onClick,
}: {
	active: boolean;
	icon: typeof FileCode;
	label: string;
	count: number;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			tabIndex={active ? 0 : -1}
			className={cn(
				"flex h-8 w-full select-none items-center gap-2 rounded-md px-2 text-left text-sm",
				active
					? "bg-sidebar-accent text-sidebar-accent-foreground"
					: "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
			)}
		>
			<Icon className="size-4 shrink-0" />
			<span className="min-w-0 flex-1 truncate">{label}</span>
			<span className="text-xs text-muted-foreground">{count}</span>
		</button>
	);
}

function SnippetRow({
	snippet,
	selected,
	showShell,
	onSelect,
	onToggle,
}: {
	snippet: Snippet;
	selected: boolean;
	showShell: boolean;
	onSelect: () => void;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			tabIndex={selected ? 0 : -1}
			aria-selected={selected}
			className={cn(
				"group flex w-full select-none items-center gap-3 border-b border-border px-3 py-2 text-left",
				selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/55",
				!snippet.enabled && "text-muted-foreground",
			)}
		>
			<Switch
				size="sm"
				checked={snippet.enabled}
				onClick={(event) => event.stopPropagation()}
				onCheckedChange={onToggle}
				aria-label={snippet.enabled ? "Disable snippet" : "Enable snippet"}
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className={cn("truncate text-sm font-medium", !snippet.enabled && "line-through")}>
						{snippet.name}
					</span>
					{showShell && (
						<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
							{capitalizeShellName(snippet.shell_type)}
						</span>
					)}
				</div>
				<div className="truncate font-mono text-xs text-muted-foreground">
					{snippet.content}
				</div>
			</div>
			<ChevronRight className="size-4 text-muted-foreground opacity-70" />
		</button>
	);
}

function AliasRow({
	alias,
	selected,
	onSelect,
}: {
	alias: AliasResponse;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			tabIndex={selected ? 0 : -1}
			aria-selected={selected}
			className={cn(
				"flex w-full select-none items-center gap-3 border-b border-border px-3 py-2 text-left",
				selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/55",
			)}
		>
			<Hash className="size-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium">{alias.name}</div>
				<div className="truncate font-mono text-xs text-muted-foreground">
					{alias.command}
				</div>
			</div>
			<span className="text-xs text-muted-foreground">{alias.snippets.length}</span>
		</button>
	);
}

function EnvironmentRow({
	environment,
	selected,
	onSelect,
}: {
	environment: Environment;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			tabIndex={selected ? 0 : -1}
			aria-selected={selected}
			className={cn(
				"flex w-full select-none items-center gap-3 border-b border-border px-3 py-2 text-left",
				selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/55",
				!environment.enabled && "text-muted-foreground",
			)}
		>
			<Braces className="size-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium">{environment.name}</div>
				<div className="truncate text-xs text-muted-foreground">
					{environment.description || "No description"}
				</div>
			</div>
			<span className="text-xs text-muted-foreground">{environment.env_vars.length}</span>
		</button>
	);
}

function InspectorAction({
	children,
	onClick,
	variant = "outline",
}: {
	children: ReactNode;
	onClick: () => void;
	variant?: "outline" | "destructive";
}) {
	return (
		<Button
			type="button"
			variant={variant === "destructive" ? "destructive" : "outline"}
			size="sm"
			onClick={onClick}
			className="gap-1.5"
		>
			{children}
		</Button>
	);
}

export function NativeAppShell() {
	const { snippets, loading: snippetsLoading, toggleSnippet, deleteSnippet, reorderSnippets, refetch } =
		useSnippets();
	const { aliases, aliasMap, loading: aliasesLoading, deleteAlias, mutate: mutateAliases } =
		useAliases();
	const { environments, loading: envLoading, deleteEnvironment, mutate: mutateEnvironments } =
		useEnvironments();
	const { available_shells, default_shell } = useShellInfo();
	const [layout, setLayout] = useState(loadLayout);
	const [status, setStatus] = useState<StatusState>({ message: "", tone: "idle" });
	const [environmentDialogOpen, setEnvironmentDialogOpen] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState<Environment | undefined>();
	const showSnippetsLoading = useDelayedFlag(snippetsLoading);
	const showAliasesLoading = useDelayedFlag(aliasesLoading);
	const showEnvLoading = useDelayedFlag(envLoading);

	useEffect(() => {
		localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
	}, [layout]);

	useEffect(() => {
		document.getElementById("native-search")?.focus();
	}, []);

	useEffect(() => {
		const onContextMenu = (event: MouseEvent) => {
			if (!isEditableTarget(event.target)) {
				event.preventDefault();
			}
		};

		window.addEventListener("contextmenu", onContextMenu);
		return () => window.removeEventListener("contextmenu", onContextMenu);
	}, []);

	const setSection = (section: Section) => {
		setLayout((current) => ({ ...current, section }));
	};

	const setSearch = (value: string) => {
		setLayout((current) => ({
			...current,
			search: { ...current.search, [current.section]: value },
		}));
	};

	const selectItem = (section: Section, id: number) => {
		setLayout((current) => ({
			...current,
			section,
			selected: { ...current.selected, [section]: id },
		}));
	};

	const refreshAll = useCallback(() => {
		refetch();
		mutateAliases();
		mutateEnvironments();
	}, [refetch, mutateAliases, mutateEnvironments]);

	const handleSyncAll = useCallback(async () => {
		setStatus({ message: "Syncing shells...", tone: "pending" });
		try {
			const paths = await syncApi.syncAllShells();
			setStatus({
				message: `${paths.length} shell file${paths.length === 1 ? "" : "s"} updated`,
				tone: "success",
			});
		} catch (error) {
			setStatus({
				message: error instanceof Error ? error.message : "Sync failed",
				tone: "error",
			});
		}
	}, []);

	const handleMenuCommand = useCallback(
		(command: string) => {
			if (command === "new-snippet") openCreateWindow("snippet");
			if (command === "new-alias") openCreateWindow("alias");
			if (command === "sync") void handleSyncAll();
			if (command === "focus-search") {
				document.getElementById("native-search")?.focus();
			}
			if (command === "toggle-inspector") {
				setLayout((current) => ({
					...current,
					inspectorCollapsed: !current.inspectorCollapsed,
				}));
			}
		},
		[handleSyncAll],
	);

	useEffect(() => {
		const unlistenData = listen("data-changed", refreshAll);
		const unlistenMenu = listen<string>("menu-command", (event) => {
			handleMenuCommand(event.payload);
		});
		return () => {
			unlistenData.then((fn) => fn());
			unlistenMenu.then((fn) => fn());
		};
	}, [handleMenuCommand, refreshAll]);

	const shellFilters = useMemo(() => {
		const shells = [default_shell, ...available_shells.filter((s) => s !== default_shell).sort()];
		return ["all", ...shells];
	}, [available_shells, default_shell]);

	const query = layout.search[layout.section];
	const filteredSnippets = useMemo(() => {
		return snippets.filter((snippet) => {
			const shellMatches = layout.shellFilter === "all" || snippet.shell_type === layout.shellFilter;
			const queryMatches =
				itemMatches(snippet.name, query) ||
				itemMatches(snippet.description, query) ||
				itemMatches(snippet.content, query);
			return shellMatches && queryMatches;
		});
	}, [snippets, layout.shellFilter, query]);

	const filteredAliases = useMemo(() => {
		return aliases.filter(
			(alias) =>
				itemMatches(alias.name, query) ||
				itemMatches(alias.command, query) ||
				itemMatches(alias.description, query),
		);
	}, [aliases, query]);

	const filteredEnvironments = useMemo(() => {
		return environments.filter(
			(environment) =>
				itemMatches(environment.name, query) ||
				itemMatches(environment.description, query) ||
				environment.env_vars.some((v) => itemMatches(v.key, query) || itemMatches(v.value, query)),
		);
	}, [environments, query]);

	const selectedSnippet =
		filteredSnippets.find((snippet) => snippet.id === layout.selected.snippets) ?? filteredSnippets[0];
	const selectedAlias = filteredAliases.find((alias) => alias.id === layout.selected.aliases) ?? filteredAliases[0];
	const selectedEnvironment =
		filteredEnvironments.find((environment) => environment.id === layout.selected.environments) ??
		filteredEnvironments[0];

	const currentTitle =
		layout.section === "snippets"
			? "Snippets"
			: layout.section === "aliases"
				? "Aliases"
				: "Environments";

	const handleCreate = () => {
		if (layout.section === "snippets") openCreateWindow("snippet");
		if (layout.section === "aliases") openCreateWindow("alias");
		if (layout.section === "environments") {
			setEditingEnvironment(undefined);
			setEnvironmentDialogOpen(true);
		}
	};

	const confirmDelete = async (title: string, message: string) => {
		return confirm(message, {
			title,
			kind: "warning",
			okLabel: "Delete",
			cancelLabel: "Cancel",
		});
	};

	const handleDeleteSnippet = async (snippet: Snippet) => {
		if (!(await confirmDelete("Delete snippet?", `"${snippet.name}" will be permanently deleted.`))) return;
		await deleteSnippet(snippet.id);
		setStatus({ message: "Snippet deleted", tone: "success" });
	};

	const handleDeleteAlias = async (alias: AliasResponse) => {
		if (!(await confirmDelete("Delete alias?", `"${alias.name}" and its generated snippets will be deleted.`))) return;
		await deleteAlias(alias.id);
		setStatus({ message: "Alias deleted", tone: "success" });
	};

	const handleDeleteEnvironment = async (environment: Environment) => {
		if (!(await confirmDelete("Delete environment?", `"${environment.name}" and its variables will be deleted.`))) return;
		await deleteEnvironment(environment.id);
		setStatus({ message: "Environment deleted", tone: "success" });
	};

	const handleReorder = async (direction: -1 | 1) => {
		if (layout.section !== "snippets" || layout.shellFilter === "all" || !selectedSnippet) return;
		const currentIndex = filteredSnippets.findIndex((snippet) => snippet.id === selectedSnippet.id);
		const nextIndex = currentIndex + direction;
		if (nextIndex < 0 || nextIndex >= filteredSnippets.length) return;
		const fromIndex = snippets.findIndex((snippet) => snippet.id === selectedSnippet.id);
		const toIndex = snippets.findIndex((snippet) => snippet.id === filteredSnippets[nextIndex].id);
		if (fromIndex === -1 || toIndex === -1) return;
		await reorderSnippets(fromIndex, toIndex);
		setStatus({ message: "Snippet order updated", tone: "success" });
	};

	const selectRelativeItem = (direction: -1 | 1) => {
		const items =
			layout.section === "snippets"
				? filteredSnippets
				: layout.section === "aliases"
					? filteredAliases
					: filteredEnvironments;
		if (items.length === 0) return;

		const currentId = layout.selected[layout.section];
		const currentIndex = items.findIndex((item) => item.id === currentId);
		const fallbackIndex = direction === 1 ? -1 : items.length;
		const nextIndex = Math.min(
			Math.max((currentIndex === -1 ? fallbackIndex : currentIndex) + direction, 0),
			items.length - 1,
		);
		selectItem(layout.section, items[nextIndex].id);
	};

	const handleEditSelected = () => {
		if (layout.section === "snippets" && selectedSnippet) {
			openCreateWindow("snippet", selectedSnippet.id);
		}
		if (layout.section === "aliases" && selectedAlias) {
			openCreateWindow("alias", selectedAlias.id);
		}
		if (layout.section === "environments" && selectedEnvironment) {
			setEditingEnvironment(selectedEnvironment);
			setEnvironmentDialogOpen(true);
		}
	};

	const handleDeleteSelected = () => {
		if (layout.section === "snippets" && selectedSnippet) void handleDeleteSnippet(selectedSnippet);
		if (layout.section === "aliases" && selectedAlias) void handleDeleteAlias(selectedAlias);
		if (layout.section === "environments" && selectedEnvironment) {
			void handleDeleteEnvironment(selectedEnvironment);
		}
	};

	const handleShellKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (isEditableTarget(event.target)) {
			if (event.key === "Escape") {
				setSearch("");
				(event.target as HTMLElement).blur();
			}
			return;
		}

		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			selectRelativeItem(event.key === "ArrowDown" ? 1 : -1);
		}
		if (event.key === "Enter") {
			event.preventDefault();
			handleEditSelected();
		}
		if (event.key === " " && layout.section === "snippets" && selectedSnippet) {
			event.preventDefault();
			void toggleSnippet(selectedSnippet.id);
		}
		if (event.key === "Backspace" || event.key === "Delete") {
			event.preventDefault();
			handleDeleteSelected();
		}
		if (event.key === "Escape") {
			event.preventDefault();
			if (query) {
				setSearch("");
			} else if (!layout.inspectorCollapsed) {
				setLayout((current) => ({ ...current, inspectorCollapsed: true }));
			}
		}
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div
				className="flex h-screen select-none bg-background text-foreground"
				onKeyDown={handleShellKeyDown}
				spellCheck={false}
			>
				<aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-2 py-3 text-sidebar-foreground">
					<div className="mb-3 flex items-center gap-2 px-2">
						<div className="flex size-7 items-center justify-center rounded-md bg-sidebar-accent">
							<TerminalIcon className="size-4" />
						</div>
						<div className="min-w-0">
							<div className="truncate text-sm font-semibold">Shell Snippets</div>
							<div className="truncate text-xs text-muted-foreground">Local utility</div>
						</div>
					</div>
					<nav className="flex flex-col gap-1">
						<SidebarButton
							active={layout.section === "snippets"}
							icon={FileCode}
							label="Snippets"
							count={snippets.length}
							onClick={() => setSection("snippets")}
						/>
						<SidebarButton
							active={layout.section === "aliases"}
							icon={Hash}
							label="Aliases"
							count={aliases.length}
							onClick={() => setSection("aliases")}
						/>
						<SidebarButton
							active={layout.section === "environments"}
							icon={Braces}
							label="Environments"
							count={environments.length}
							onClick={() => setSection("environments")}
						/>
					</nav>
					{layout.section === "snippets" && (
						<div className="mt-5 flex flex-col gap-1">
							<div className="px-2 text-xs font-medium text-muted-foreground">Shell</div>
							{shellFilters.map((shell) => (
								<button
									key={shell}
									type="button"
									onClick={() => setLayout((current) => ({ ...current, shellFilter: shell }))}
									className={cn(
										"flex h-7 items-center justify-between rounded-md px-2 text-sm",
										layout.shellFilter === shell
											? "bg-sidebar-accent text-sidebar-accent-foreground"
											: "text-sidebar-foreground/75 hover:bg-sidebar-accent/70",
									)}
								>
									<span>{capitalizeShellName(shell)}</span>
									{shell === "all" && <span className="text-xs text-muted-foreground">{snippets.length}</span>}
								</button>
							))}
						</div>
					)}
					<div className="mt-auto flex flex-col gap-2 px-2">
						<InlineStatus status={status} />
						<Button variant="outline" size="sm" onClick={handleSyncAll} className="justify-start gap-1.5">
							<RefreshCw className="size-4" />
							Sync
						</Button>
					</div>
				</aside>

				<section className="flex min-w-0 flex-1 flex-col">
					<header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
						<h1 className="w-36 text-sm font-semibold">{currentTitle}</h1>
						<div className="relative max-w-sm flex-1">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="native-search"
								value={query}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={`Search ${currentTitle.toLowerCase()}`}
								className="h-8 pl-8"
							/>
						</div>
						<div className="ml-auto flex items-center gap-2">
							{layout.section === "snippets" && layout.shellFilter !== "all" && (
								<div className="flex items-center gap-1">
									<Button variant="outline" size="icon-sm" onClick={() => handleReorder(-1)} title="Move up">
										<ChevronLeft className="size-4 rotate-90" />
									</Button>
									<Button variant="outline" size="icon-sm" onClick={() => handleReorder(1)} title="Move down">
										<ChevronRight className="size-4 rotate-90" />
									</Button>
								</div>
							)}
							<Button
								variant="outline"
								size="icon-sm"
								onClick={() =>
									setLayout((current) => ({
										...current,
										inspectorCollapsed: !current.inspectorCollapsed,
									}))
								}
								title={layout.inspectorCollapsed ? "Show inspector" : "Hide inspector"}
							>
								{layout.inspectorCollapsed ? (
									<PanelRightOpen className="size-4" />
								) : (
									<PanelRightClose className="size-4" />
								)}
							</Button>
							<Button size="sm" onClick={handleCreate} className="gap-1.5">
								<Plus className="size-4" />
								New
							</Button>
						</div>
					</header>

					<div className="flex min-h-0 flex-1">
						<div className="min-w-0 flex-1 overflow-auto">
							{layout.section === "snippets" && (
								<ListPane loading={showSnippetsLoading} empty={!snippetsLoading && filteredSnippets.length === 0}>
									{filteredSnippets.map((snippet) => (
										<SnippetRow
											key={snippet.id}
											snippet={snippet}
											selected={selectedSnippet?.id === snippet.id}
											showShell={layout.shellFilter === "all"}
											onSelect={() => selectItem("snippets", snippet.id)}
											onToggle={() => toggleSnippet(snippet.id)}
										/>
									))}
								</ListPane>
							)}
							{layout.section === "aliases" && (
								<ListPane loading={showAliasesLoading} empty={!aliasesLoading && filteredAliases.length === 0}>
									{filteredAliases.map((alias) => (
										<AliasRow
											key={alias.id}
											alias={alias}
											selected={selectedAlias?.id === alias.id}
											onSelect={() => selectItem("aliases", alias.id)}
										/>
									))}
								</ListPane>
							)}
							{layout.section === "environments" && (
								<ListPane loading={showEnvLoading} empty={!envLoading && filteredEnvironments.length === 0}>
									{filteredEnvironments.map((environment) => (
										<EnvironmentRow
											key={environment.id}
											environment={environment}
											selected={selectedEnvironment?.id === environment.id}
											onSelect={() => selectItem("environments", environment.id)}
										/>
									))}
								</ListPane>
							)}
						</div>

						{!layout.inspectorCollapsed && (
							<aside className="w-[360px] shrink-0 overflow-auto border-l border-border bg-muted/25">
								{layout.section === "snippets" && selectedSnippet && (
									<SnippetInspector
										snippet={selectedSnippet}
										aliasName={aliasMap.get(selectedSnippet.id)}
										onEdit={() => openCreateWindow("snippet", selectedSnippet.id)}
										onDelete={() => handleDeleteSnippet(selectedSnippet)}
									/>
								)}
								{layout.section === "aliases" && selectedAlias && (
									<AliasInspector
										alias={selectedAlias}
										onEdit={() => openCreateWindow("alias", selectedAlias.id)}
										onDelete={() => handleDeleteAlias(selectedAlias)}
									/>
								)}
								{layout.section === "environments" && selectedEnvironment && (
									<EnvironmentInspector
										environment={selectedEnvironment}
										onEdit={() => {
											setEditingEnvironment(selectedEnvironment);
											setEnvironmentDialogOpen(true);
										}}
										onDelete={() => handleDeleteEnvironment(selectedEnvironment)}
									/>
								)}
							</aside>
						)}
					</div>
				</section>

				<CreateEnvironmentDialog
					open={environmentDialogOpen}
					onOpenChange={(open) => {
						setEnvironmentDialogOpen(open);
						if (!open) {
							setEditingEnvironment(undefined);
							refreshAll();
						}
					}}
					environment={editingEnvironment}
				/>
			</div>
		</DndProvider>
	);
}

function ListPane({
	loading,
	empty,
	children,
}: {
	loading: boolean;
	empty: boolean;
	children: ReactNode;
}) {
	if (loading) {
		return <div className="p-3 text-sm text-muted-foreground">Loading...</div>;
	}
	if (empty) {
		return (
			<EmptyState
				icon={FileCode}
				title="No items"
				description="Create an item or adjust the current search and shell filter."
			/>
		);
	}
	return <div>{children}</div>;
}

function SnippetInspector({
	snippet,
	aliasName,
	onEdit,
	onDelete,
}: {
	snippet: Snippet;
	aliasName?: string;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div>
				<div className="text-lg font-semibold">{snippet.name}</div>
				<div className="font-mono text-xs text-muted-foreground">
					{capitalizeShellName(snippet.shell_type)} {snippet.enabled ? "enabled" : "disabled"}
				</div>
			</div>
			{snippet.description && <p className="text-sm text-muted-foreground">{snippet.description}</p>}
			{aliasName && <div className="text-sm text-muted-foreground">Alias: {aliasName}</div>}
			<SnippetCodeBlock content={snippet.content} shellType={snippet.shell_type} />
			<div className="flex gap-2">
				<InspectorAction onClick={onEdit}>
					<Pencil className="size-4" />
					Edit
				</InspectorAction>
				<InspectorAction onClick={onDelete} variant="destructive">
					<Trash2 className="size-4" />
					Delete
				</InspectorAction>
			</div>
		</div>
	);
}

function AliasInspector({
	alias,
	onEdit,
	onDelete,
}: {
	alias: AliasResponse;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div>
				<div className="text-lg font-semibold">{alias.name}</div>
				<div className="font-mono text-xs text-muted-foreground">{alias.command}</div>
			</div>
			{alias.description && <p className="text-sm text-muted-foreground">{alias.description}</p>}
			<div className="rounded-md border border-code-border bg-code-bg p-3 font-mono text-sm text-foreground">
				{alias.command}
			</div>
			{alias.snippets.length > 0 && (
				<div className="flex flex-col gap-2">
					<div className="text-xs font-medium text-muted-foreground">Generated snippets</div>
					{alias.snippets.map((snippet) => (
						<div key={snippet.id} className="rounded-md border border-border px-2 py-1 text-sm">
							{snippet.name}{" "}
							<span className="font-mono text-xs text-muted-foreground">
								{capitalizeShellName(snippet.shell_type)}
							</span>
						</div>
					))}
				</div>
			)}
			<div className="flex gap-2">
				<InspectorAction onClick={onEdit}>
					<Pencil className="size-4" />
					Edit
				</InspectorAction>
				<InspectorAction onClick={onDelete} variant="destructive">
					<Trash2 className="size-4" />
					Delete
				</InspectorAction>
			</div>
		</div>
	);
}

function EnvironmentInspector({
	environment,
	onEdit,
	onDelete,
}: {
	environment: Environment;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div>
				<div className="text-lg font-semibold">{environment.name}</div>
				<div className="text-xs text-muted-foreground">
					{environment.enabled ? "Enabled" : "Disabled"} · {environment.env_vars.length} variables
				</div>
			</div>
			{environment.description && <p className="text-sm text-muted-foreground">{environment.description}</p>}
			<div className="rounded-md border border-code-border bg-code-bg p-3 font-mono text-sm">
				{environment.env_vars.length > 0 ? (
					environment.env_vars.map((variable) => (
						<div key={variable.id} className="flex gap-1">
							<span className="text-success">{variable.key}</span>
							<span className="text-muted-foreground">=</span>
							<span className="truncate text-foreground/80">{variable.value}</span>
						</div>
					))
				) : (
					<div className="text-muted-foreground">No variables defined</div>
				)}
			</div>
			<div className="flex gap-2">
				<InspectorAction onClick={onEdit}>
					<Pencil className="size-4" />
					Edit
				</InspectorAction>
				<InspectorAction onClick={onDelete} variant="destructive">
					<Trash2 className="size-4" />
					Delete
				</InspectorAction>
			</div>
		</div>
	);
}
