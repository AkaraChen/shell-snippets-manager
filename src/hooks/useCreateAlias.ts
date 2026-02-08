import { useMutation } from '@tanstack/react-query';
import { useSWRConfig } from 'swr';
import { aliasApi } from '@/api/snippets';
import type { NewAlias, AliasResponse } from '@/types/snippet';

const ALIASES_KEY = 'aliases';

export function useCreateAlias() {
  const { mutate: swrMutate } = useSWRConfig();

  return useMutation({
    mutationFn: (data: NewAlias) => aliasApi.create(data),
    onSuccess: (newAlias: AliasResponse) => {
      swrMutate(ALIASES_KEY, (current: AliasResponse[] | undefined) =>
        [...(current || []), newAlias],
        false
      );
    },
  });
}
