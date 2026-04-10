import { Braces } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import type { Environment } from "@/types/environment";
import { EnvironmentItem } from "./EnvironmentItem";

interface EnvironmentListProps {
	environments: Environment[];
	loading: boolean;
	onEdit: (env: Environment) => void;
	onDelete: (id: number) => void;
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<div className="w-16 h-16 rounded-full bg-code-bg border border-code-border flex items-center justify-center mb-4">
				<Braces className="w-8 h-8 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-(--font-mono) text-foreground mb-2">
				No environments yet
			</h3>
			<p className="text-sm text-muted-foreground text-center max-w-sm">
				Create your first environment to manage groups of environment
				variables.
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
						<div className="w-24 h-5 bg-muted rounded" />
						<div className="w-16 h-5 bg-muted rounded" />
					</div>
				</div>
			))}
		</div>
	);
}

export function EnvironmentList({
	environments,
	loading,
	onEdit,
	onDelete,
}: EnvironmentListProps) {
	if (loading) return <LoadingSkeleton />;
	if (environments.length === 0) return <EmptyState />;

	return (
		<div className="space-y-1">
			<Accordion type="single" collapsible className="space-y-2">
				{environments.map((env) => (
					<EnvironmentItem
						key={env.id}
						environment={env}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</Accordion>
		</div>
	);
}
