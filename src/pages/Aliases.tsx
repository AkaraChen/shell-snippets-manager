import { useState } from "react";
import { AliasList } from "@/components/AliasList";
import { CreateAliasDialog } from "@/components/CreateAliasDialog";
import { EditAliasDialog } from "@/components/EditAliasDialog";
import { Header } from "@/components/Header";
import { useAliases } from "@/hooks/useAliases";
import { useSnippets } from "@/hooks/useSnippets";
import type { AliasResponse } from "@/types/snippet";

export function Aliases() {
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editingAlias, setEditingAlias] = useState<AliasResponse | null>(
		null,
	);
	const { aliases, loading, deleteAlias } = useAliases();
	const { snippets } = useSnippets();

	const handleDelete = async (id: number) => {
		await deleteAlias(id);
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header
				onCreateClick={() => setCreateDialogOpen(true)}
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

			<CreateAliasDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
			/>

			<EditAliasDialog
				alias={editingAlias}
				open={!!editingAlias}
				onOpenChange={(open) => !open && setEditingAlias(null)}
			/>
		</div>
	);
}
