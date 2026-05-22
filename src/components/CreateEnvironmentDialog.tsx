import { Braces, Loader2 } from "lucide-react";
import { Suspense } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useCreateEnvironment } from "@/hooks/useCreateEnvironment";
import { useUpdateEnvironment } from "@/hooks/useUpdateEnvironment";
import type { Environment } from "@/types/environment";
import { EnvironmentForm, type EnvironmentFormData } from "./EnvironmentForm";

interface CreateEnvironmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	environment?: Environment;
}

function EnvironmentDialogContent({
	environment,
	onOpenChange,
}: {
	environment?: Environment;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate: createEnvironment, isPending: isCreating } =
		useCreateEnvironment();
	const { mutate: updateEnvironment, isPending: isUpdating } =
		useUpdateEnvironment();

	const isEdit = !!environment;
	const isPending = isCreating || isUpdating;

	const handleSubmit = (data: EnvironmentFormData) => {
		if (isEdit) {
			updateEnvironment(
				{
					id: environment.id,
					metadata: { name: data.name, description: data.description },
					vars: data.vars,
					originalVars: environment.env_vars,
					toDelete: data.toDelete,
				},
				{ onSuccess: () => onOpenChange(false) },
			);
		} else {
			createEnvironment(
				{
					name: data.name,
					description: data.description,
					variables: data.vars.filter((v) => v.key.trim()),
				},
				{ onSuccess: () => onOpenChange(false) },
			);
		}
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2 font-(--font-mono)">
					<Braces className="w-5 h-5 text-muted-foreground" />
					{isEdit ? "Edit Environment" : "Create Environment"}
				</DialogTitle>
			</DialogHeader>
			<EnvironmentForm
				mode={isEdit ? "edit" : "create"}
				initialData={environment}
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

export function CreateEnvironmentDialog({
	open,
	onOpenChange,
	environment,
}: CreateEnvironmentDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg border-code-border max-h-[85vh] overflow-y-auto">
				<Suspense fallback={<LoadingFallback />}>
					{/* key forces form to remount when switching between create/edit */}
					<EnvironmentDialogContent
						key={environment?.id ?? "new"}
						environment={environment}
						onOpenChange={onOpenChange}
					/>
				</Suspense>
			</DialogContent>
		</Dialog>
	);
}
