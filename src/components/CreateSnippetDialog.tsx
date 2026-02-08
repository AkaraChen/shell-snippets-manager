import { Loader2, Terminal } from "lucide-react";
import { Suspense } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateAlias } from "@/hooks/useCreateAlias";
import { useCreateSnippet } from "@/hooks/useCreateSnippet";
import type { NewAlias, NewSnippet, UpdateAlias, UpdateSnippet } from "@/types/snippet";
import { AliasForm } from "./AliasForm";
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
	const { mutate: createAlias, isPending: isAliasPending } = useCreateAlias();

	const handleSnippetSubmit = (data: NewSnippet | UpdateSnippet) => {
		createSnippet(data as NewSnippet, {
			onSuccess: () => {
				onOpenChange(false);
			},
		});
	};

	const handleAliasSubmit = (data: NewAlias | UpdateAlias) => {
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
					<Terminal className="w-5 h-5 text-success" />
					Create
				</DialogTitle>
			</DialogHeader>

			<Tabs defaultValue="snippet">
				<TabsList className="w-full">
					<TabsTrigger value="snippet" className="flex-1">
						Snippet
					</TabsTrigger>
					<TabsTrigger value="alias" className="flex-1">
						Alias
					</TabsTrigger>
				</TabsList>

				<TabsContent value="snippet">
					<SnippetForm
						mode="create"
						onSubmit={handleSnippetSubmit}
						onCancel={() => onOpenChange(false)}
						isPending={isSnippetPending}
					/>
				</TabsContent>

				<TabsContent value="alias">
					<AliasForm
						onSubmit={handleAliasSubmit}
						onCancel={() => onOpenChange(false)}
						isPending={isAliasPending}
					/>
				</TabsContent>
			</Tabs>
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
