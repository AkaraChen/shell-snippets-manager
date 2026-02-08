import { useMutation } from "@tanstack/react-query";
import { useSWRConfig } from "swr";
import { aliasApi } from "@/api/snippets";
import type { AliasResponse, UpdateAlias } from "@/types/snippet";

const ALIASES_KEY = "aliases";
const SNIPPETS_KEY = "snippets";

export function useUpdateAlias() {
	const { mutate: swrMutate } = useSWRConfig();

	return useMutation({
		mutationFn: ({ id, updates }: { id: number; updates: UpdateAlias }) =>
			aliasApi.update(id, updates),
		onSuccess: (updatedAlias: AliasResponse) => {
			swrMutate(
				ALIASES_KEY,
				(current: AliasResponse[] | undefined) =>
					current?.map((a) =>
						a.id === updatedAlias.id ? updatedAlias : a,
					),
				false,
			);
			// Revalidate snippets cache since alias name changes affect generated snippets
			swrMutate(SNIPPETS_KEY);
		},
	});
}
