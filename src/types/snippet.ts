export const SHELL_TYPES = ["bash", "zsh", "fish"] as const;
export type ShellType = string;
export const SNIPPET_FILTER_SHELLS = ["zsh", "bash"] as const;

export interface ShellInfo {
	available_shells: string[];
	default_shell: string;
}

export interface Snippet {
	id: number;
	name: string;
	content: string;
	shell_type: ShellType;
	description: string | null;
	enabled: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface NewSnippet {
	name: string;
	content: string;
	shell_type: ShellType;
	description?: string | null;
	enabled?: number; // 0 or 1 for SQLite
	sort_order?: number;
}

export interface UpdateSnippet {
	name?: string;
	content?: string;
	shell_type?: ShellType;
	description?: string | null;
	enabled?: number;
	sort_order?: number;
}

export interface AliasResponse {
	id: number;
	name: string;
	command: string;
	description: string | null;
	snippets: Snippet[];
	created_at: string;
	updated_at: string;
}

export interface NewAlias {
	name: string;
	command: string;
	description?: string | null;
	shell_types: string[];
}

export interface UpdateAlias {
	name?: string;
	command?: string;
	description?: string | null;
}
