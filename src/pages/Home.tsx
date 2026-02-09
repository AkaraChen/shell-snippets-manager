import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Header } from "@/components/Header";
import { SnippetList } from "@/components/SnippetList";
import { useAliases } from "@/hooks/useAliases";
import { useShellInfo } from "@/hooks/useShellInfo";
import { useSnippets } from "@/hooks/useSnippets";
import { openCreateWindow } from "@/lib/createWindow";
import type { Snippet } from "@/types/snippet";

export function Home() {
	const { snippets, loading, toggleSnippet, deleteSnippet, reorderSnippets, refetch } =
		useSnippets();
	const { available_shells, default_shell } = useShellInfo();
	const { aliases, aliasMap, mutate: mutateAliases } = useAliases();
	const [selectedShell, setSelectedShell] = useState(default_shell);

	// Listen for data changes from the create window
	useEffect(() => {
		const unlisten = listen("data-changed", () => {
			refetch();
			mutateAliases();
		});
		return () => {
			unlisten.then((fn) => fn());
		};
	}, [refetch, mutateAliases]);

	const handleEdit = (snippet: Snippet) => {
		openCreateWindow("snippet", snippet.id);
	};

	const handleDelete = async (id: number) => {
		await deleteSnippet(id);
	};

	const filteredSnippets = useMemo(
		() => snippets.filter((s) => s.shell_type === selectedShell),
		[snippets, selectedShell],
	);

	const sortedShells = useMemo(() => {
		const others = available_shells
			.filter((s) => s !== default_shell)
			.sort();
		return [default_shell, ...others];
	}, [available_shells, default_shell]);

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="min-h-screen bg-background text-foreground">
				<Header
					onCreateClick={() => openCreateWindow("snippet")}
					selectedShell={selectedShell}
					availableShells={sortedShells}
					onShellChange={setSelectedShell}
					snippetCount={snippets.length}
					aliasCount={aliases.length}
				/>

				<main className="container mx-auto px-4 py-6 max-w-3xl">
					<SnippetList
						snippets={filteredSnippets}
						loading={loading}
						onToggle={toggleSnippet}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onReorder={reorderSnippets}
						aliasMap={aliasMap}
					/>
				</main>
			</div>
		</DndProvider>
	);
}
