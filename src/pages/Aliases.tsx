import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { AliasList } from "@/components/AliasList";
import { EditAliasDialog } from "@/components/EditAliasDialog";
import { Header } from "@/components/Header";
import { useAliases } from "@/hooks/useAliases";
import { useSnippets } from "@/hooks/useSnippets";
import { openCreateWindow } from "@/lib/createWindow";
import type { AliasResponse } from "@/types/snippet";

export function Aliases() {
	const [editingAlias, setEditingAlias] = useState<AliasResponse | null>(
		null,
	);
	const { aliases, loading, deleteAlias, mutate: mutateAliases } = useAliases();
	const { snippets, refetch: refetchSnippets } = useSnippets();

	// Listen for data changes from the create window
	useEffect(() => {
		const unlisten = listen("data-changed", () => {
			mutateAliases();
			refetchSnippets();
		});
		return () => {
			unlisten.then((fn) => fn());
		};
	}, [mutateAliases, refetchSnippets]);

	const handleDelete = async (id: number) => {
		await deleteAlias(id);
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header
				onCreateClick={() => openCreateWindow("alias")}
				snippetCount={snippets.length}
				aliasCount={aliases.length}
			/>

			<main className="container mx-auto px-4 py-6 max-w-3xl">
				<AliasList
					aliases={aliases}
					loading={loading}
					onEdit={setEditingAlias}
					onDelete={handleDelete}
				/>
			</main>

			<EditAliasDialog
				alias={editingAlias}
				open={!!editingAlias}
				onOpenChange={(open) => !open && setEditingAlias(null)}
			/>
		</div>
	);
}
