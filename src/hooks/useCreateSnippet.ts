import { useMutation } from "@tanstack/react-query";
import { useSWRConfig } from "swr";
import { snippetApi } from "@/api/snippets";
import type { NewSnippet, Snippet } from "@/types/snippet";

const SNIPPETS_KEY = "snippets";

export function useCreateSnippet() {
	const { mutate: swrMutate } = useSWRConfig();

	return useMutation({
		mutationFn: (data: NewSnippet) => snippetApi.create(data),
		onSuccess: (newSnippet: Snippet) => {
			swrMutate(
				SNIPPETS_KEY,
				(current: Snippet[] | undefined) => [
					...(current || []),
					newSnippet,
				],
				false,
			);
		},
	});
}
