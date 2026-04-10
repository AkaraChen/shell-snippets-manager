import { useMutation } from "@tanstack/react-query";
import { useSWRConfig } from "swr";
import { environmentApi } from "@/api/environments";
import type { Environment, NewEnvironment } from "@/types/environment";
import { ENVIRONMENTS_KEY } from "./useEnvironments";

export function useCreateEnvironment() {
	const { mutate: swrMutate } = useSWRConfig();

	return useMutation({
		mutationFn: (data: NewEnvironment) => environmentApi.create(data),
		onSuccess: (newEnv: Environment) => {
			swrMutate(
				ENVIRONMENTS_KEY,
				(current: Environment[] | undefined) => [
					...(current ?? []),
					newEnv,
				],
				false,
			);
		},
	});
}
