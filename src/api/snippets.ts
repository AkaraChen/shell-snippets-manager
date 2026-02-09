import { invoke } from "@tauri-apps/api/core";
import type {
	AliasResponse,
	NewAlias,
	NewSnippet,
	ShellInfo,
	ShellType,
	Snippet,
	UpdateAlias,
	UpdateSnippet,
} from "../types/snippet";

export const snippetApi = {
	// Snippet CRUD
	getAll: () => invoke<Snippet[]>("get_snippets"),

	getById: (id: number) => invoke<Snippet>("get_snippet", { id }),

	create: (snippet: NewSnippet) =>
		invoke<Snippet>("create_snippet", { snippet }),

	update: (id: number, updates: UpdateSnippet) =>
		invoke<Snippet>("update_snippet", { id, updates }),

	delete: (id: number) => invoke<void>("delete_snippet", { id }),

	toggle: (id: number) => invoke<Snippet>("toggle_snippet", { id }),

	reorder: (order: [number, number][]) =>
		invoke<void>("reorder_snippets", { order }),
};

export const syncApi = {
	// Sync operations
	syncToFile: (shellType: ShellType) =>
		invoke<string>("sync_to_file", { shellType }),

	syncAllShells: () => invoke<string[]>("sync_all_shells"),

	getSourceLine: (shellType: ShellType) =>
		invoke<string>("get_source_line", { shellType }),

	getOutputDirectory: () => invoke<string>("get_output_directory"),

	openOutputDirectory: () => invoke<void>("open_output_directory"),

	openFileInEditor: (filePath: string) =>
		invoke<void>("open_file_in_editor", { filePath }),
};

export const aliasApi = {
	getAll: () => invoke<AliasResponse[]>("get_aliases"),
	getById: (id: number) => invoke<AliasResponse>("get_alias", { id }),
	create: (alias: NewAlias) => {
		const { shell_types, ...aliasData } = alias;
		return invoke<AliasResponse>("create_alias", {
			alias: aliasData,
			shellTypes: shell_types,
		});
	},
	update: (id: number, updates: UpdateAlias) =>
		invoke<AliasResponse>("update_alias", { id, updates }),
	delete: (id: number) => invoke<void>("delete_alias", { id }),
};

export const shellApi = {
	getShellInfo: () => invoke<ShellInfo>("get_shell_info"),
};
