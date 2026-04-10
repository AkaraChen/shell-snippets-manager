import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Environment } from "@/types/environment";

interface VarRow {
	_key: string;
	id?: number;
	key: string;
	value: string;
}

export interface EnvironmentFormData {
	name: string;
	description: string | null;
	vars: Array<{ id?: number; key: string; value: string }>;
	toDelete: number[];
}

interface EnvironmentFormProps {
	mode?: "create" | "edit";
	initialData?: Environment;
	onSubmit: (data: EnvironmentFormData) => void;
	onCancel: () => void;
	isPending: boolean;
}

export function EnvironmentForm({
	mode = "create",
	initialData,
	onSubmit,
	onCancel,
	isPending,
}: EnvironmentFormProps) {
	const [name, setName] = useState(initialData?.name ?? "");
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [showDescriptionField, setShowDescriptionField] = useState(
		!!initialData?.description,
	);
	const descriptionRef = useRef<HTMLTextAreaElement>(null);

	const [vars, setVars] = useState<VarRow[]>(
		initialData?.env_vars.map((v) => ({
			_key: String(v.id),
			id: v.id,
			key: v.key,
			value: v.value,
		})) ?? [],
	);
	const [toDelete, setToDelete] = useState<number[]>([]);

	const addVar = () => {
		setVars((prev) => [
			...prev,
			{ _key: `new-${Date.now()}`, key: "", value: "" },
		]);
	};

	const updateVar = (index: number, field: "key" | "value", val: string) => {
		setVars((prev) =>
			prev.map((v, i) => (i === index ? { ...v, [field]: val } : v)),
		);
	};

	const removeVar = (index: number) => {
		const row = vars[index];
		if (row.id !== undefined) {
			setToDelete((prev) => [...prev, row.id!]);
		}
		setVars((prev) => prev.filter((_, i) => i !== index));
	};

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
		if (!name.trim()) return;

		onSubmit({
			name: name.trim(),
			description: description.trim() || null,
			vars: vars.map(({ _key: _, ...v }) => v),
			toDelete,
		});
	};

	const isEdit = mode === "edit";

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* Name */}
			<div className="space-y-2">
				<Label
					htmlFor="env-name"
					className="text-xs uppercase tracking-wider text-muted-foreground"
				>
					Name *
				</Label>
				<Input
					id="env-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g., Production"
					required
				/>
			</div>

			{/* Description */}
			{showDescriptionField ? (
				<div className="space-y-2">
					<Label
						htmlFor="env-description"
						className="text-xs uppercase tracking-wider text-muted-foreground"
					>
						Description
					</Label>
					<Textarea
						ref={descriptionRef}
						id="env-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onBlur={handleDescriptionBlur}
						placeholder="Describe this environment..."
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

			{/* Variables */}
			<div className="space-y-2">
				<Label className="text-xs uppercase tracking-wider text-muted-foreground">
					Variables
				</Label>
				<div className="space-y-2">
					{vars.map((v, i) => (
						<div key={v._key} className="flex items-center gap-2">
							<Input
								value={v.key}
								onChange={(e) => updateVar(i, "key", e.target.value)}
								placeholder="KEY"
								className="font-(--font-mono) flex-1"
							/>
							<span className="text-muted-foreground text-sm font-(--font-mono) shrink-0 select-none">
								=
							</span>
							<Input
								value={v.value}
								onChange={(e) => updateVar(i, "value", e.target.value)}
								placeholder="value"
								className="font-(--font-mono) flex-1"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => removeVar(i)}
								className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							>
								<X className="w-4 h-4" />
							</Button>
						</div>
					))}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addVar}
						className="w-full border-dashed text-muted-foreground hover:text-foreground"
					>
						<Plus className="w-4 h-4 mr-2" />
						Add variable
					</Button>
				</div>
			</div>

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
					disabled={isPending || !name.trim()}
					className="bg-success hover:bg-success/90 text-black"
				>
					{isPending
						? isEdit
							? "Saving..."
							: "Creating..."
						: isEdit
							? "Save Changes"
							: "Create Environment"}
				</Button>
			</div>
		</form>
	);
}
