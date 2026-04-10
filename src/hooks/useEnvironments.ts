import useSWR from "swr";
import { environmentApi } from "@/api/environments";
import type { Environment } from "@/types/environment";

export const ENVIRONMENTS_KEY = "environments";

export function useEnvironments() {
	const { data, error, isLoading, mutate } = useSWR<Environment[]>(
		ENVIRONMENTS_KEY,
		() => environmentApi.getAll(),
	);

	const deleteEnvironment = async (id: number) => {
		await environmentApi.delete(id);
		await mutate(
			(current) => current?.filter((e) => e.id !== id),
			false,
		);
	};

	return {
		environments: data ?? [],
		loading: isLoading,
		error,
		deleteEnvironment,
		mutate,
	};
}
