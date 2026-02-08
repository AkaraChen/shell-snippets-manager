import { useMutation } from "@tanstack/react-query";
import { useSWRConfig } from "swr";
import { snippetApi } from "@/api/snippets";
import type { Snippet, UpdateSnippet } from "@/types/snippet";

const SNIPPETS_KEY = "snippets";

export function useUpdateSnippet() {
	const { mutate: swrMutate } = useSWRConfig();

	return useMutation({
		mutationFn: ({ id, updates }: { id: number; updates: UpdateSnippet }) =>
			snippetApi.update(id, updates),
		onSuccess: (updatedSnippet: Snippet) => {
			swrMutate(
				SNIPPETS_KEY,
				(current: Snippet[] | undefined) =>
					current?.map((s) =>
						s.id === updatedSnippet.id ? updatedSnippet : s,
					),
				false,
			);
		},
	});
}
