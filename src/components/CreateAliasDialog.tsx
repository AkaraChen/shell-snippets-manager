import { Loader2, Terminal } from "lucide-react";
import { Suspense } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useCreateAlias } from "@/hooks/useCreateAlias";
import type { NewAlias, UpdateAlias } from "@/types/snippet";
import { AliasForm } from "./AliasForm";

interface CreateAliasDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function CreateAliasDialogContent({
	onOpenChange,
}: { onOpenChange: (open: boolean) => void }) {
	const { mutate: createAlias, isPending } = useCreateAlias();

	const handleSubmit = (data: NewAlias | UpdateAlias) => {
		createAlias(data as NewAlias, {
			onSuccess: () => {
				onOpenChange(false);
			},
		});
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2 font-(--font-mono)">
					<Terminal className="w-5 h-5 text-muted-foreground" />
					Create Alias
				</DialogTitle>
			</DialogHeader>

			<AliasForm
				mode="create"
				onSubmit={handleSubmit}
				onCancel={() => onOpenChange(false)}
				isPending={isPending}
			/>
		</>
	);
}

function LoadingFallback() {
	return (
		<div className="flex items-center justify-center py-12">
			<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
		</div>
	);
}

export function CreateAliasDialog({
	open,
	onOpenChange,
}: CreateAliasDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg border-code-border">
				<Suspense fallback={<LoadingFallback />}>
					<CreateAliasDialogContent onOpenChange={onOpenChange} />
				</Suspense>
			</DialogContent>
		</Dialog>
	);
}
