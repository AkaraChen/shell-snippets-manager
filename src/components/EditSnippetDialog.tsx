import { Loader2, Pencil } from "lucide-react";
import { Suspense } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateSnippet } from "@/hooks/useUpdateSnippet";
import type { NewSnippet, Snippet, UpdateSnippet } from "@/types/snippet";
import { SnippetForm } from "./SnippetForm";

interface EditSnippetDialogProps {
	snippet: Snippet | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditSnippetDialogContentProps {
	snippet: Snippet;
	onOpenChange: (open: boolean) => void;
}

function EditSnippetDialogContent({
	snippet,
	onOpenChange,
}: EditSnippetDialogContentProps) {
	const { mutate: updateSnippet, isPending } = useUpdateSnippet();

	const handleSubmit = (data: NewSnippet | UpdateSnippet) => {
		updateSnippet(
			{ id: snippet.id, updates: data as UpdateSnippet },
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
				<DialogTitle className="flex items-center gap-2 font-[var(--font-mono)]">
					<Pencil className="w-5 h-5 text-success" />
					Edit Snippet
				</DialogTitle>
			</DialogHeader>

			<SnippetForm
				mode="edit"
				initialData={snippet}
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

export function EditSnippetDialog({
	snippet,
	open,
	onOpenChange,
}: EditSnippetDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg border-code-border">
				{snippet ? (
					<Suspense fallback={<LoadingFallback />}>
						<EditSnippetDialogContent
							snippet={snippet}
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
