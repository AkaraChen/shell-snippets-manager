import { FileCode } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import type { Snippet } from "@/types/snippet";
import { DraggableSnippetItem } from "./DraggableSnippetItem";

interface SnippetListProps {
	snippets: Snippet[];
	loading: boolean;
	onToggle: (id: number) => void;
	onEdit: (snippet: Snippet) => void;
	onDelete: (id: number) => void;
	onReorder: (fromIndex: number, toIndex: number) => void;
	aliasMap?: Map<number, string>;
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<div className="w-16 h-16 rounded-full bg-code-bg border border-code-border flex items-center justify-center mb-4">
				<FileCode className="w-8 h-8 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-(--font-mono) text-foreground mb-2">
				No snippets yet
			</h3>
			<p className="text-sm text-muted-foreground text-center max-w-sm">
				Create your first shell snippet to get started. Your aliases,
				functions, and commands will appear here.
			</p>
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="space-y-2">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="border border-code-border rounded-lg p-4 animate-pulse"
				>
					<div className="flex items-center gap-3">
						<div className="w-12 h-5 bg-muted rounded" />
						<div className="w-48 h-5 bg-muted rounded" />
					</div>
				</div>
			))}
		</div>
	);
}

export function SnippetList({
	snippets,
	loading,
	onToggle,
	onEdit,
	onDelete,
	onReorder,
	aliasMap,
}: SnippetListProps) {
	// Local state for immediate visual feedback during drag
	const [localSnippets, setLocalSnippets] = useState<Snippet[]>(snippets);

	// Sync with external state when it changes (after API confirms)
	useEffect(() => {
		setLocalSnippets(snippets);
	}, [snippets]);

	const moveSnippet = useCallback((dragIndex: number, hoverIndex: number) => {
		// Optimistic local reorder for smooth UX
		setLocalSnippets((prev) => {
			const updated = [...prev];
			const [removed] = updated.splice(dragIndex, 1);
			updated.splice(hoverIndex, 0, removed);
			return updated;
		});
	}, []);

	const handleDragEnd = useCallback(
		(fromIndex: number, toIndex: number) => {
			// Only call API if position actually changed
			if (fromIndex !== toIndex) {
				onReorder(fromIndex, toIndex);
			}
		},
		[onReorder],
	);

	if (loading) {
		return <LoadingSkeleton />;
	}

	if (localSnippets.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className="space-y-1">
			<Accordion type="single" collapsible className="space-y-2">
				{localSnippets.map((snippet, index) => (
					<DraggableSnippetItem
						key={snippet.id}
						index={index}
						snippet={snippet}
						onToggle={onToggle}
						onEdit={onEdit}
						onDelete={onDelete}
						moveSnippet={moveSnippet}
						onDragEnd={handleDragEnd}
						aliasName={aliasMap?.get(snippet.id)}
					/>
				))}
			</Accordion>
		</div>
	);
}
