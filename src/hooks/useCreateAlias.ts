import { useMutation } from "@tanstack/react-query";
import { useSWRConfig } from "swr";
import { aliasApi } from "@/api/snippets";
import type { AliasResponse, NewAlias } from "@/types/snippet";

const ALIASES_KEY = "aliases";
const SNIPPETS_KEY = "snippets";

export function useCreateAlias() {
	const { mutate: swrMutate } = useSWRConfig();

	return useMutation({
		mutationFn: (data: NewAlias) => aliasApi.create(data),
		onSuccess: (newAlias: AliasResponse) => {
			swrMutate(
				ALIASES_KEY,
				(current: AliasResponse[] | undefined) => [
					...(current || []),
					newAlias,
				],
				false,
			);
			// Revalidate snippets cache since new snippets were auto-generated
			swrMutate(SNIPPETS_KEY);
		},
	});
}
