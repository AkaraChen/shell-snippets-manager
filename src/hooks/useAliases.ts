import { useMemo } from "react";
import useSWR from "swr";
import { aliasApi } from "@/api/snippets";
import type { AliasResponse } from "@/types/snippet";

const ALIASES_KEY = "aliases";

export function useAliases() {
	const { data, error, isLoading, mutate } = useSWR<AliasResponse[]>(
		ALIASES_KEY,
		() => aliasApi.getAll(),
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

	const deleteAlias = async (id: number) => {
		await aliasApi.delete(id);
		await mutate(
			(current) => current?.filter((a) => a.id !== id),
			false,
		);
	};

	return {
		aliases: data ?? [],
		aliasMap,
		loading: isLoading,
		error,
		deleteAlias,
		mutate,
	};
}
