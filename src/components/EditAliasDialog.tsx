import { Loader2, Pencil } from "lucide-react";
import { Suspense } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateAlias } from "@/hooks/useUpdateAlias";
import type { AliasResponse, NewAlias, UpdateAlias } from "@/types/snippet";
import { AliasForm } from "./AliasForm";

interface EditAliasDialogProps {
	alias: AliasResponse | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditAliasDialogContentProps {
	alias: AliasResponse;
	onOpenChange: (open: boolean) => void;
}

function EditAliasDialogContent({
	alias,
	onOpenChange,
}: EditAliasDialogContentProps) {
	const { mutate: updateAlias, isPending } = useUpdateAlias();

	const handleSubmit = (data: NewAlias | UpdateAlias) => {
		updateAlias(
			{ id: alias.id, updates: data as UpdateAlias },
			{
				onSuccess: () => {
					onOpenChange(false);
				},
			},
		);
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2 font-(--font-mono)">
					<Pencil className="w-5 h-5 text-success" />
					Edit Alias
				</DialogTitle>
			</DialogHeader>

			<AliasForm
				mode="edit"
				initialData={alias}
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

export function EditAliasDialog({
	alias,
	open,
	onOpenChange,
}: EditAliasDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg border-code-border">
				{alias ? (
					<Suspense fallback={<LoadingFallback />}>
						<EditAliasDialogContent
							alias={alias}
							onOpenChange={onOpenChange}
						/>
					</Suspense>
				) : (
					<LoadingFallback />
				)}
			</DialogContent>
		</Dialog>
	);
}
