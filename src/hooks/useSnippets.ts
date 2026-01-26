import useSWR from 'swr';
import { snippetApi } from '@/api/snippets';
import type { Snippet, NewSnippet } from '@/types/snippet';

const SNIPPETS_KEY = 'snippets';

export function useSnippets() {
  const { data, error, isLoading, mutate } = useSWR<Snippet[]>(
    SNIPPETS_KEY,
    () => snippetApi.getAll()
  );

  const createSnippet = async (newData: NewSnippet): Promise<Snippet> => {
    const newSnippet = await snippetApi.create(newData);
    await mutate((current) => [...(current || []), newSnippet], false);
    return newSnippet;
  };

  const toggleSnippet = async (id: number): Promise<void> => {
    const updatedSnippet = await snippetApi.toggle(id);
    await mutate(
      (current) => current?.map((s) => (s.id === id ? updatedSnippet : s)),
      false
    );
  };

  const deleteSnippet = async (id: number): Promise<void> => {
    await snippetApi.delete(id);
    await mutate((current) => current?.filter((s) => s.id !== id), false);
  };

  return {
    snippets: data ?? [],
    loading: isLoading,
    error,
    refetch: mutate,
    createSnippet,
    toggleSnippet,
    deleteSnippet,
  };
}
