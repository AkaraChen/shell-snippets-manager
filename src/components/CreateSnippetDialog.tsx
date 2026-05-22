import { Loader2, Terminal } from "lucide-react";
import { Suspense } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useCreateSnippet } from "@/hooks/useCreateSnippet";
import type { NewSnippet, UpdateSnippet } from "@/types/snippet";
import { SnippetForm } from "./SnippetForm";

interface CreateSnippetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface CreateSnippetDialogContentProps {
	onOpenChange: (open: boolean) => void;
}

function CreateSnippetDialogContent({
	onOpenChange,
}: CreateSnippetDialogContentProps) {
	const { mutate: createSnippet, isPending: isSnippetPending } =
		useCreateSnippet();

	const handleSnippetSubmit = (data: NewSnippet | UpdateSnippet) => {
		createSnippet(data as NewSnippet, {
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
					Create
				</DialogTitle>
			</DialogHeader>

			<SnippetForm
				mode="create"
				onSubmit={handleSnippetSubmit}
				onCancel={() => onOpenChange(false)}
				isPending={isSnippetPending}
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

export function CreateSnippetDialog({
	open,
	onOpenChange,
}: CreateSnippetDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg border-code-border">
				<Suspense fallback={<LoadingFallback />}>
					<CreateSnippetDialogContent onOpenChange={onOpenChange} />
				</Suspense>
			</DialogContent>
		</Dialog>
	);
}
