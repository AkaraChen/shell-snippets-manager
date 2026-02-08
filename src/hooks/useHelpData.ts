import useSWR from "swr";
import { syncApi } from "@/api/snippets";
import { useShellInfo } from "./useShellInfo";

interface HelpData {
	outputDir: string;
	sourceLines: Record<string, string>;
}

const HELP_DATA_KEY = "help-data";

export function useHelpData() {
	const { available_shells, default_shell } = useShellInfo();

	// Sort shells: default first, then alphabetically
	const sortedShells = [
		default_shell,
		...available_shells.filter((s) => s !== default_shell).sort(),
	];

	const { data, error, isLoading } = useSWR<HelpData>(
		HELP_DATA_KEY,
		async () => {
			const outputDir = await syncApi.getOutputDirectory();

			// Fetch source lines for available shells only
			const sourceLines: Record<string, string> = {};
			for (const shellType of sortedShells) {
				sourceLines[shellType] = await syncApi.getSourceLine(shellType);
			}

			return { outputDir, sourceLines };
		},
		{ suspense: true },
	);

	return {
		helpData: data!,
		loading: isLoading,
		error,
		sortedShells,
		defaultShell: default_shell,
	};
}
