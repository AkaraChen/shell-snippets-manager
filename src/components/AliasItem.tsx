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
import type { AliasResponse } from "@/types/snippet";

interface AliasItemProps {
	alias: AliasResponse;
	onEdit: (alias: AliasResponse) => void;
	onDelete: (id: number) => void;
}

export function AliasItem({ alias, onEdit, onDelete }: AliasItemProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleDelete = () => {
		onDelete(alias.id);
		setShowDeleteConfirm(false);
	};

	return (
		<>
			<AccordionItem
				value={`alias-${alias.id}`}
				className="border border-code-border rounded-lg mb-2 overflow-hidden bg-card/50 hover:bg-card/80 transition-colors"
			>
				<AccordionTrigger className="px-4 py-3 hover:no-underline">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<span className="font-(--font-mono) text-sm truncate">
							{alias.name}
						</span>
						<span className="text-xs text-muted-foreground truncate hidden sm:inline">
							{alias.command}
						</span>
						{alias.snippets.length > 0 && (
							<Badge
								variant="outline"
								className="text-xs font-(--font-mono) shrink-0"
							>
								{alias.snippets.length} snippet
								{alias.snippets.length !== 1 ? "s" : ""}
							</Badge>
						)}
					</div>
				</AccordionTrigger>

				<AccordionContent className="px-4 pb-4">
					<div className="space-y-4">
						{/* Command */}
						<div className="rounded-md bg-code-bg border border-code-border p-3">
							<code className="text-sm font-(--font-mono) text-foreground">
								{alias.command}
							</code>
						</div>

						{/* Description */}
						{alias.description && (
							<p className="text-sm text-foreground/80">
								{alias.description}
							</p>
						)}

						{/* Associated snippets */}
						{alias.snippets.length > 0 && (
							<div className="space-y-1.5">
								<span className="text-xs uppercase tracking-wider text-muted-foreground">
									Shell Snippets
								</span>
								<div className="flex flex-wrap gap-1.5">
									{alias.snippets.map((snippet) => (
										<Badge
											key={snippet.id}
											variant="secondary"
											className="font-(--font-mono) text-xs"
										>
											{snippet.name} ({snippet.shell_type}
											)
										</Badge>
									))}
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-2 pt-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onEdit(alias)}
								className="text-muted-foreground hover:text-foreground"
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

			{/* Delete confirmation dialog */}
			<AlertDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
			>
				<AlertDialogContent className="border-code-border">
					<AlertDialogHeader>
						<AlertDialogTitle className="font-(--font-mono)">
							Delete alias?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete{" "}
							<span className="font-(--font-mono) text-foreground">
								"{alias.name}"
							</span>{" "}
							and its associated shell snippets. This action
							cannot be undone.
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
