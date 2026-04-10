import { useMutation } from "@tanstack/react-query";
import { useSWRConfig } from "swr";
import { environmentApi } from "@/api/environments";
import type { Environment, EnvironmentVariable, UpdateEnvironment } from "@/types/environment";
import { ENVIRONMENTS_KEY } from "./useEnvironments";

interface VarRow {
	id?: number;
	key: string;
	value: string;
}

interface UpdateEnvironmentInput {
	id: number;
	metadata: UpdateEnvironment;
	vars: VarRow[];
	originalVars: EnvironmentVariable[];
	toDelete: number[];
}

export function useUpdateEnvironment() {
	const { mutate: swrMutate } = useSWRConfig();

	return useMutation({
		mutationFn: async ({
			id,
			metadata,
			vars,
			originalVars,
			toDelete,
		}: UpdateEnvironmentInput): Promise<Environment> => {
			// 1. Update environment metadata
			await environmentApi.update(id, metadata);

			// 2. Delete removed variables
			for (const varId of toDelete) {
				await environmentApi.deleteVariable(varId);
			}

			// 3. Update changed existing variables
			for (const v of vars.filter((v) => v.id !== undefined)) {
				const orig = originalVars.find((o) => o.id === v.id);
				if (orig && (orig.key !== v.key || orig.value !== v.value)) {
					await environmentApi.updateVariable(v.id!, v.key, v.value);
				}
			}

			// 4. Add new variables (rows without an id)
			for (const v of vars.filter((v) => v.id === undefined)) {
				if (v.key.trim()) {
					await environmentApi.addVariable(id, v.key.trim(), v.value.trim());
				}
			}

			return environmentApi.getById(id);
		},
		onSuccess: (updatedEnv: Environment) => {
			swrMutate(
				ENVIRONMENTS_KEY,
				(current: Environment[] | undefined) =>
					current?.map((e) => (e.id === updatedEnv.id ? updatedEnv : e)),
				false,
			);
		},
		onError: () => {
			// A partial failure may have committed some operations — force re-fetch
			// to reconcile UI with the actual database state.
			swrMutate(ENVIRONMENTS_KEY);
		},
	});
}
