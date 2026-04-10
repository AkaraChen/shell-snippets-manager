import { invoke } from "@tauri-apps/api/core";
import type {
  Environment,
  EnvironmentVariable,
  NewEnvironment,
  UpdateEnvironment,
} from "@/types/environment";

export const environmentApi = {
  getAll: () => invoke<Environment[]>("get_environments"),
  getById: (id: number) => invoke<Environment>("get_environment", { id }),
  // Strip `variables` from data; convert objects to [key, value] tuples for Rust's Vec<(String, String)>
  create: ({ variables, ...data }: NewEnvironment) =>
    invoke<Environment>("create_environment", {
      data,
      variables: variables.map((v) => [v.key, v.value]),
    }),
  update: (id: number, updates: UpdateEnvironment) =>
    invoke<Environment>("update_environment", { id, updates }),
  delete: (id: number) => invoke<void>("delete_environment", { id }),
  toggle: (id: number) => invoke<Environment>("toggle_environment", { id }),
  generateExports: (shellType: string, environmentId: number) =>
    invoke<string>("generate_environment_exports", { shellType, environmentId }),
  addVariable: (envId: number, key: string, value: string) =>
    invoke<EnvironmentVariable>("add_environment_variable", { envId, key, value }),
  updateVariable: (varId: number, key: string, value: string) =>
    invoke<EnvironmentVariable>("update_environment_variable", { varId, key, value }),
  deleteVariable: (varId: number) =>
    invoke<void>("delete_environment_variable", { varId }),
};