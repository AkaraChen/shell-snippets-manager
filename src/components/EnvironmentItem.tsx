import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Environment } from "@/types/environment";

interface EnvironmentItemProps {
	environment: Environment;
	onEdit: (env: Environment) => void;
	onDelete: (id: number) => void;
}

export function EnvironmentItem({
	environment,
	onEdit,
	onDelete,
}: EnvironmentItemProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleDelete = () => {
		onDelete(environment.id);
		setShowDeleteConfirm(false);
	};

	return (
		<>
			<AccordionItem
				value={`env-${environment.id}`}
				className="border border-code-border rounded-lg mb-2 overflow-hidden bg-card/50 hover:bg-card/80 transition-colors"
			>
				<AccordionTrigger className="px-4 py-3 hover:no-underline">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<span className="font-(--font-mono) text-sm truncate">
							{environment.name}
						</span>
						{environment.env_vars.length > 0 && (
							<Badge
								variant="outline"
								className="text-xs font-(--font-mono) shrink-0"
							>
								{environment.env_vars.length} var
								{environment.env_vars.length !== 1 ? "s" : ""}
							</Badge>
						)}
						{!environment.enabled && (
							<Badge variant="secondary" className="text-xs shrink-0">
								disabled
							</Badge>
						)}
					</div>
				</AccordionTrigger>

				<AccordionContent className="px-4 pb-4">
					<div className="space-y-4">
						{/* Description */}
						{environment.description && (
							<p className="text-sm text-foreground/80">
								{environment.description}
							</p>
						)}

						{/* Variables */}
						{environment.env_vars.length > 0 ? (
							<div className="rounded-md bg-code-bg border border-code-border p-3 space-y-1 font-(--font-mono)">
								{environment.env_vars.map((v) => (
									<div
										key={v.id}
										className="flex items-center gap-1 text-sm"
									>
										<span className="text-success">{v.key}</span>
										<span className="text-muted-foreground">=</span>
										<span className="text-foreground/80 truncate">
											{v.value}
										</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground italic">
								No variables defined
							</p>
						)}

						{/* Actions */}
						<div className="flex items-center gap-2 pt-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onEdit(environment)}
								className="text-muted-foreground hover:text-foreground hover:bg-success/10"
							>
								<Pencil className="w-3.5 h-3.5 mr-1.5" />
								Edit
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowDeleteConfirm(true)}
								className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							>
								<Trash2 className="w-3.5 h-3.5 mr-1.5" />
								Delete
							</Button>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>

			<AlertDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
			>
				<AlertDialogContent className="border-code-border">
					<AlertDialogHeader>
						<AlertDialogTitle className="font-(--font-mono)">
							Delete environment?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete{" "}
							<span className="font-(--font-mono) text-foreground">
								"{environment.name}"
							</span>{" "}
							and all its variables. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive hover:bg-destructive/90 text-white"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
