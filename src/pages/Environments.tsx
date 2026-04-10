import { useState } from "react";
import { CreateEnvironmentDialog } from "@/components/CreateEnvironmentDialog";
import { EnvironmentList } from "@/components/EnvironmentList";
import { Header } from "@/components/Header";
import { useAliases } from "@/hooks/useAliases";
import { useEnvironments } from "@/hooks/useEnvironments";
import { useSnippets } from "@/hooks/useSnippets";
import type { Environment } from "@/types/environment";

export function Environments() {
	const { environments, loading, deleteEnvironment } = useEnvironments();
	const { snippets } = useSnippets();
	const { aliases } = useAliases();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState<
		Environment | undefined
	>();

	const handleEdit = (env: Environment) => {
		setEditingEnvironment(env);
		setIsDialogOpen(true);
	};

	const handleCreate = () => {
		setEditingEnvironment(undefined);
		setIsDialogOpen(true);
	};

	const handleDialogChange = (open: boolean) => {
		setIsDialogOpen(open);
		if (!open) setEditingEnvironment(undefined);
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header
				onCreateClick={handleCreate}
				createLabel="New Environment"
				snippetCount={snippets.length}
				aliasCount={aliases.length}
				environmentCount={environments.length}
			/>

			<main className="container mx-auto px-4 py-6 max-w-3xl">
				<EnvironmentList
					environments={environments}
					loading={loading}
					onEdit={handleEdit}
					onDelete={deleteEnvironment}
				/>
			</main>

			<CreateEnvironmentDialog
				open={isDialogOpen}
				onOpenChange={handleDialogChange}
				environment={editingEnvironment}
			/>
		</div>
	);
}
