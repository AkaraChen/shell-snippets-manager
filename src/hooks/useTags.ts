import { useMutation } from '@tanstack/react-query';
import useSWR, { useSWRConfig } from 'swr';
import { tagApi } from '@/api/snippets';
import type { Tag, NewTag } from '@/types/snippet';

const TAGS_KEY = 'tags';
const SNIPPETS_KEY = 'snippets';

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<Tag[]>(
    TAGS_KEY,
    () => tagApi.getAll()
  );

  return {
    tags: data ?? [],
    loading: isLoading,
    error,
    refetch: mutate,
  };
}

export function useCreateTag() {
  const { mutate: swrMutate } = useSWRConfig();

  return useMutation({
    mutationFn: (tag: NewTag) => tagApi.create(tag),
    onSuccess: (newTag: Tag) => {
      swrMutate(TAGS_KEY, (current: Tag[] | undefined) =>
        [...(current || []), newTag],
        false
      );
    },
  });
}

export function useDeleteTag() {
  const { mutate: swrMutate } = useSWRConfig();

  return useMutation({
    mutationFn: (id: number) => tagApi.delete(id),
    onSuccess: (_: void, id: number) => {
      swrMutate(TAGS_KEY, (current: Tag[] | undefined) =>
        current?.filter((t) => t.id !== id),
        false
      );
    },
  });
}

export function useAddTagToSnippet() {
  const { mutate: swrMutate } = useSWRConfig();

  return useMutation({
    mutationFn: ({ snippetId, tagId }: { snippetId: number; tagId: number }) =>
      tagApi.addToSnippet(snippetId, tagId),
    onSuccess: () => {
      // Refetch snippets to get updated tags
      swrMutate(SNIPPETS_KEY);
    },
  });
}

export function useRemoveTagFromSnippet() {
  const { mutate: swrMutate } = useSWRConfig();

  return useMutation({
    mutationFn: ({ snippetId, tagId }: { snippetId: number; tagId: number }) =>
      tagApi.removeFromSnippet(snippetId, tagId),
    onSuccess: () => {
      // Refetch snippets to get updated tags
      swrMutate(SNIPPETS_KEY);
    },
  });
}
