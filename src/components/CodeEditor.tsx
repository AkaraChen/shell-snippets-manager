import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
	syntaxHighlighting,
	bracketMatching,
	StreamLanguage,
	HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { shell } from "@codemirror/legacy-modes/mode/shell";

interface CodeEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

const editorTheme = EditorView.theme({
	"&": {
		fontSize: "13px",
		fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
		backgroundColor: "var(--editor-bg)",
		color: "var(--editor-foreground)",
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-scroller": {
		fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
	},
	".cm-content": {
		caretColor: "var(--editor-cursor)",
	},
	".cm-cursor, .cm-dropCursor": {
		borderLeftColor: "var(--editor-cursor)",
	},
	"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
		backgroundColor: "var(--editor-selection)",
	},
	".cm-activeLine": {
		backgroundColor: "var(--editor-active-line)",
	},
	".cm-gutters": {
		backgroundColor: "var(--editor-gutter-bg)",
		color: "var(--editor-gutter-foreground)",
		borderRightColor: "var(--code-border)",
	},
	".cm-line": {
		color: "var(--editor-foreground)",
	},
	".cm-placeholder": {
		color: "var(--muted-foreground)",
	},
});

const shellHighlightStyle = HighlightStyle.define([
	{ tag: tags.keyword, color: "var(--syntax-keyword)" },
	{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: "var(--syntax-atom)" },
	{ tag: [tags.string, tags.character], color: "var(--syntax-string)" },
	{ tag: [tags.variableName, tags.definition(tags.variableName)], color: "var(--syntax-variable)" },
	{ tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--syntax-comment)", fontStyle: "italic" },
	{ tag: tags.number, color: "var(--syntax-number)" },
	{ tag: tags.operator, color: "var(--editor-foreground)" },
]);

export function CodeEditor({
	value,
	onChange,
	placeholder = "",
	className,
}: CodeEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const onChangeRef = useRef(onChange);

	// Keep onChange ref up to date
	onChangeRef.current = onChange;

	useEffect(() => {
		if (!containerRef.current) return;

		const state = EditorState.create({
			doc: value,
			extensions: [
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap]),
				StreamLanguage.define(shell),
				syntaxHighlighting(shellHighlightStyle, { fallback: true }),
				bracketMatching(),
				editorTheme,
				cmPlaceholder(placeholder),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						onChangeRef.current(update.state.doc.toString());
					}
				}),
				EditorView.lineWrapping,
			],
		});

		const view = new EditorView({
			state,
			parent: containerRef.current,
		});

		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
		// Only re-create on placeholder change, not value (handled below)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [placeholder]);

	// Sync external value changes into the editor
	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;

		const currentValue = view.state.doc.toString();
		if (currentValue !== value) {
			view.dispatch({
				changes: {
					from: 0,
					to: currentValue.length,
					insert: value,
				},
			});
		}
	}, [value]);

	return (
		<div
			ref={containerRef}
			className={className}
		/>
	);
}
