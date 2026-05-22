import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-input placeholder:text-muted-foreground focus-visible:border-ring aria-invalid:border-destructive dark:bg-input/45 flex field-sizing-content min-h-16 w-full rounded-[6px] border bg-background/70 px-3 py-2 text-base transition-[background-color,border-color] outline-none focus-visible:bg-background/85 focus-visible:ring-0 aria-invalid:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
