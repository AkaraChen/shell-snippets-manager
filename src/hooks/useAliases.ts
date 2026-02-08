import { useMemo } from 'react';
import useSWR from 'swr';
import { aliasApi } from '@/api/snippets';
import type { AliasResponse } from '@/types/snippet';

const ALIASES_KEY = 'aliases';

export function useAliases() {
  const { data, error, isLoading } = useSWR<AliasResponse[]>(
    ALIASES_KEY,
    () => aliasApi.getAll()
  );

  const aliasMap = useMemo(() => {
    const map = new Map<number, string>();
    if (data) {
      for (const alias of data) {
        for (const snippet of alias.snippets) {
          map.set(snippet.id, alias.name);
        }
      }
    }
    return map;
  }, [data]);

  return {
    aliases: data ?? [],
    aliasMap,
    loading: isLoading,
    error,
  };
}
