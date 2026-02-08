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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Snippet } from "@/types/snippet";
import { DragHandle } from "./DragHandle";
import { SnippetCodeBlock } from "./SnippetCodeBlock";

interface SnippetItemProps {
	snippet: Snippet;
	onToggle: (id: number) => void;
	onEdit: (snippet: Snippet) => void;
	onDelete: (id: number) => void;
	isDragging?: boolean;
	dragRef?: (element: HTMLElement | null) => void;
	aliasName?: string;
}

export function SnippetItem({
	snippet,
	onToggle,
	onEdit,
	onDelete,
	isDragging,
	dragRef,
	aliasName,
}: SnippetItemProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleDelete = () => {
		onDelete(snippet.id);
		setShowDeleteConfirm(false);
	};

	return (
		<>
			<AccordionItem
				value={`snippet-${snippet.id}`}
				className={cn(
					"border border-code-border rounded-lg mb-2 overflow-hidden",
					"bg-card/50 hover:bg-card/80 transition-colors",
					!snippet.enabled && "opacity-60",
					isDragging && "shadow-lg ring-2 ring-success/30",
				)}
			>
				<AccordionTrigger className="px-4 py-3 hover:no-underline">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						{/* Drag handle - attach drag ref here */}
						<div ref={dragRef as React.Ref<HTMLDivElement>}>
							<DragHandle />
						</div>
						<span
							className={cn(
								"font-(--font-mono) text-sm truncate",
								!snippet.enabled &&
									"line-through text-muted-foreground",
							)}
						>
							{snippet.name}
						</span>
						{aliasName && (
							<Badge
								variant="outline"
								className="text-xs font-(--font-mono)"
							>
								Alias
							</Badge>
						)}
						{!snippet.enabled && (
							<span className="text-xs text-muted-foreground">
								(disabled)
							</span>
						)}
					</div>
				</AccordionTrigger>

				<AccordionContent className="px-4 pb-4">
					<div className="space-y-4">
						{/* Code block */}
						<SnippetCodeBlock
							content={snippet.content}
							shellType={snippet.shell_type}
						/>

						{/* Description */}
						{snippet.description && (
							<p className="text-sm text-foreground/80">
								{snippet.description}
							</p>
						)}

						{/* Actions and toggle row */}
						<div className="flex items-center gap-2 pt-2">
							{/* Action buttons on the left */}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onEdit(snippet)}
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

							{/* Enabled toggle on the right */}
							<div className="flex items-center gap-2 ml-auto">
								<Switch
									checked={snippet.enabled}
									onCheckedChange={() => onToggle(snippet.id)}
									className="data-[state=checked]:bg-success"
								/>
								<span className="text-xs text-muted-foreground">
									{snippet.enabled ? "Enabled" : "Disabled"}
								</span>
							</div>
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
							Delete snippet?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete{" "}
							<span className="font-(--font-mono) text-foreground">
								"{snippet.name}"
							</span>
							. This action cannot be undone.
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
