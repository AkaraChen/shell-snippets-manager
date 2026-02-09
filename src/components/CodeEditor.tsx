import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
	syntaxHighlighting,
	defaultHighlightStyle,
	bracketMatching,
	StreamLanguage,
} from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { oneDark } from "@codemirror/theme-one-dark";

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
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-scroller": {
		fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
	},
});

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
				syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
				bracketMatching(),
				oneDark,
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
