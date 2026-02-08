import useSWR from "swr";
import { shellApi } from "@/api/snippets";
import type { ShellInfo } from "@/types/snippet";

const SHELL_INFO_KEY = "shell-info";

export function useShellInfo() {
	const { data } = useSWR<ShellInfo>(
		SHELL_INFO_KEY,
		() => shellApi.getShellInfo(),
		{ suspense: true },
	);
	return data!;
}
