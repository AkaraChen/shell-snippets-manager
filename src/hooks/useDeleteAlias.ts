import { useMutation } from "@tanstack/react-query";
import { useSWRConfig } from "swr";
import { aliasApi } from "@/api/snippets";
import type { AliasResponse } from "@/types/snippet";

const ALIASES_KEY = "aliases";
const SNIPPETS_KEY = "snippets";

export function useDeleteAlias() {
	const { mutate: swrMutate } = useSWRConfig();

	return useMutation({
		mutationFn: (id: number) => aliasApi.delete(id),
		onSuccess: (_data, id) => {
			swrMutate(
				ALIASES_KEY,
				(current: AliasResponse[] | undefined) =>
					current?.filter((a) => a.id !== id),
				false,
			);
			// Revalidate snippets cache since associated snippets may be removed
			swrMutate(SNIPPETS_KEY);
		},
	});
}
