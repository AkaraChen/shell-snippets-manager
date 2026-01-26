export type ShellType = 'bash' | 'zsh' | 'fish' | 'sh' | 'powershell';

export interface Tag {
  id: number;
  name: string;
  color: string | null;
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
  tags: Tag[];
}

export interface NewSnippet {
  name: string;
  content: string;
  shell_type: ShellType;
  description?: string | null;
  enabled?: number;  // 0 or 1 for SQLite
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

export interface NewTag {
  name: string;
  color?: string | null;
}
