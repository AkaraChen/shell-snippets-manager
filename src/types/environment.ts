export type ShellType = string;

export interface Environment {
  id: number;
  name: string;
  description: string | null;
  enabled: boolean;
  sort_order: number;
  env_vars: EnvironmentVariable[];
  created_at: string;
  updated_at: string;
}

export interface EnvironmentVariable {
  id: number;
  environment_id: number;
  key: string;
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewEnvironment {
  name: string;
  description?: string | null;
  enabled?: number;
  sort_order?: number;
  variables: { key: string; value: string }[];
}

export interface UpdateEnvironment {
  name?: string;
  description?: string | null;
  enabled?: number;
  sort_order?: number;
}