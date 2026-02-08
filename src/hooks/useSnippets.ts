import { useCallback, useRef } from "react";
import useSWR from "swr";
import { snippetApi } from "@/api/snippets";
import type { NewSnippet, Snippet } from "@/types/snippet";

const SNIPPETS_KEY = "snippets";

export function useSnippets() {
	const { data, error, isLoading, mutate } = useSWR<Snippet[]>(
		SNIPPETS_KEY,
		() => snippetApi.getAll(),
	);

	// Keep reference to previous state for rollback
	const previousDataRef = useRef<Snippet[] | undefined>(undefined);

	const createSnippet = async (newData: NewSnippet): Promise<Snippet> => {
		const newSnippet = await snippetApi.create(newData);
		await mutate((current) => [...(current || []), newSnippet], false);
		return newSnippet;
	};

	const toggleSnippet = async (id: number): Promise<void> => {
		const updatedSnippet = await snippetApi.toggle(id);
		await mutate(
			(current) =>
				current?.map((s) => (s.id === id ? updatedSnippet : s)),
			false,
		);
	};

	const deleteSnippet = async (id: number): Promise<void> => {
		await snippetApi.delete(id);
		await mutate((current) => current?.filter((s) => s.id !== id), false);
	};

	// Reorder mutation with optimistic update
	const reorderSnippets = useCallback(
		async (fromIndex: number, toIndex: number): Promise<void> => {
			const current = data;
			if (!current || fromIndex === toIndex) return;

			// Store previous state for potential rollback
			previousDataRef.current = current;

			// Calculate new order optimistically
			const reordered = [...current];
			const [removed] = reordered.splice(fromIndex, 1);
			reordered.splice(toIndex, 0, removed);

			// Assign new sort_order values (using index * 10 for flexibility)
			const withNewOrder = reordered.map((snippet, idx) => ({
				...snippet,
				sort_order: idx * 10,
			}));

			// Optimistic update
			await mutate(withNewOrder, false);

			try {
				// Prepare order array for backend: [id, new_sort_order][]
				const orderPayload: [number, number][] = withNewOrder.map(
					(s) => [s.id, s.sort_order],
				);

				await snippetApi.reorder(orderPayload);

				// Revalidate to ensure sync with backend
				await mutate();
			} catch (error) {
				// Rollback on failure
				console.error("Failed to reorder snippets:", error);
				await mutate(previousDataRef.current, false);
				throw error;
			}
		},
		[data, mutate],
	);

	return {
		snippets: data ?? [],
		loading: isLoading,
		error,
		refetch: mutate,
		createSnippet,
		toggleSnippet,
		deleteSnippet,
		reorderSnippets,
	};
}
