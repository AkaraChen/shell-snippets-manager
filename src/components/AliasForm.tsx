import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShellInfo } from "@/hooks/useShellInfo";
import type { AliasResponse, NewAlias, UpdateAlias } from "@/types/snippet";

interface AliasFormProps {
	mode?: "create" | "edit";
	initialData?: AliasResponse;
	onSubmit: (data: NewAlias | UpdateAlias) => void;
	onCancel: () => void;
	isPending: boolean;
}

export function AliasForm({
	mode = "create",
	initialData,
	onSubmit,
	onCancel,
	isPending,
}: AliasFormProps) {
	const { available_shells } = useShellInfo();
	const [name, setName] = useState(initialData?.name ?? "");
	const [command, setCommand] = useState(initialData?.command ?? "");
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [showDescriptionField, setShowDescriptionField] = useState(
		!!initialData?.description,
	);
	const descriptionRef = useRef<HTMLTextAreaElement>(null);

	const handleDescriptionBlur = () => {
		if (!description.trim()) {
			setShowDescriptionField(false);
		}
	};

	const handleShowDescription = () => {
		setShowDescriptionField(true);
		setTimeout(() => descriptionRef.current?.focus(), 0);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !command.trim()) return;

		if (mode === "edit") {
			onSubmit({
				name: name.trim(),
				command: command.trim(),
				description: description.trim() || null,
			} satisfies UpdateAlias);
		} else {
			onSubmit({
				name: name.trim(),
				command: command.trim(),
				description: description.trim() || null,
				shell_types: available_shells,
			} satisfies NewAlias);
		}
	};

	const isEdit = mode === "edit";

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* Name */}
			<div className="space-y-2">
				<Label
					htmlFor="alias-name"
					className="text-xs uppercase tracking-wider text-muted-foreground"
				>
					Name *
				</Label>
				<Input
					id="alias-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g., ll"
					className="font-(--font-mono)"
					required
				/>
			</div>

			{/* Command */}
			<div className="space-y-2">
				<Label
					htmlFor="alias-command"
					className="text-xs uppercase tracking-wider text-muted-foreground"
				>
					Command *
				</Label>
				<Input
					id="alias-command"
					value={command}
					onChange={(e) => setCommand(e.target.value)}
					placeholder="e.g., ls -la"
					className="font-(--font-mono)"
					required
				/>
			</div>

			{/* Description */}
			{showDescriptionField ? (
				<div className="space-y-2">
					<Label
						htmlFor="alias-description"
						className="text-xs uppercase tracking-wider text-muted-foreground"
					>
						Description
					</Label>
					<Textarea
						ref={descriptionRef}
						id="alias-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onBlur={handleDescriptionBlur}
						placeholder="Describe what this alias does..."
						className="min-h-20"
					/>
				</div>
			) : (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleShowDescription}
					className="text-muted-foreground hover:text-foreground"
				>
					<Plus className="w-4 h-4 mr-1" />
					Add description
				</Button>
			)}

			{/* Footer */}
			<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isPending}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={isPending || !name.trim() || !command.trim()}
					className="bg-success hover:bg-success/90 text-black"
				>
					{isPending
						? isEdit
							? "Saving..."
							: "Creating..."
						: isEdit
							? "Save Changes"
							: "Create Alias"}
				</Button>
			</div>
		</form>
	);
}
