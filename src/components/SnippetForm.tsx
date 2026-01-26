import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useShellInfo } from '@/hooks/useShellInfo';
import { Plus } from 'lucide-react';
import type { Snippet, NewSnippet, UpdateSnippet } from '@/types/snippet';

const SNIPPET_TEMPLATES = {
  alias: {
    label: 'Alias',
    content: "alias name='command'",
  },
  // Future templates can be added here
} as const;

function capitalizeShellName(shell: string): string {
  const specialCases: Record<string, string> = {
    bash: 'Bash',
    zsh: 'Zsh',
    fish: 'Fish',
  };
  return specialCases[shell] ?? shell;
}

export interface SnippetFormProps {
  initialData?: Snippet;
  onSubmit: (data: NewSnippet | UpdateSnippet) => void;
  onCancel: () => void;
  isPending: boolean;
  mode: 'create' | 'edit';
}

export function SnippetForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
  mode,
}: SnippetFormProps) {
  const { available_shells, default_shell } = useShellInfo();

  const [name, setName] = useState(initialData?.name ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [shellType, setShellType] = useState(initialData?.shell_type ?? default_shell);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [showDescriptionField, setShowDescriptionField] = useState(!!initialData?.description);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<keyof typeof SNIPPET_TEMPLATES | null>(null);

  // Update shell type when default becomes available (for create mode)
  useEffect(() => {
    if (mode === 'create' && !initialData && default_shell) {
      setShellType(default_shell);
    }
  }, [default_shell, mode, initialData]);

  const sortedShells = useMemo(() => {
    const others = available_shells
      .filter((s) => s !== default_shell)
      .sort();
    return [default_shell, ...others];
  }, [available_shells, default_shell]);

  const handleDescriptionBlur = () => {
    if (!description.trim()) {
      setShowDescriptionField(false);
    }
  };

  const handleShowDescription = () => {
    setShowDescriptionField(true);
    setTimeout(() => descriptionRef.current?.focus(), 0);
  };

  const insertTemplate = (templateKey: keyof typeof SNIPPET_TEMPLATES) => {
    const template = SNIPPET_TEMPLATES[templateKey];
    setContent(template.content);
  };

  const handleTemplateSelect = (templateKey: keyof typeof SNIPPET_TEMPLATES) => {
    if (content.trim()) {
      // Content exists, show confirmation dialog
      setPendingTemplate(templateKey);
      setShowTemplateConfirm(true);
    } else {
      // No content, insert directly
      insertTemplate(templateKey);
    }
  };

  const handleConfirmTemplate = () => {
    if (pendingTemplate) {
      insertTemplate(pendingTemplate);
      setPendingTemplate(null);
    }
    setShowTemplateConfirm(false);
  };

  const handleCancelTemplate = () => {
    setPendingTemplate(null);
    setShowTemplateConfirm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !content.trim()) return;

    if (mode === 'create') {
      onSubmit({
        name: name.trim(),
        content: content.trim(),
        shell_type: shellType,
        description: description.trim() || null,
        enabled: 1,
      } as NewSnippet);
    } else {
      onSubmit({
        name: name.trim(),
        content: content.trim(),
        shell_type: shellType,
        description: description.trim() || null,
      } as UpdateSnippet);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
          Name *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., List all files"
          className="font-[var(--font-mono)]"
          required
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-xs uppercase tracking-wider text-muted-foreground">
            Command / Code *
          </Label>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:text-foreground"
              >
                Fill with Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-[var(--font-mono)]">
              {Object.entries(SNIPPET_TEMPLATES).map(([key, template]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleTemplateSelect(key as keyof typeof SNIPPET_TEMPLATES)}
                >
                  {template.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="alias ll='ls -la'"
          className="font-[var(--font-mono)] min-h-[120px]"
          required
        />
      </div>

      {/* Shell Type */}
      <div className="space-y-2">
        <Label htmlFor="shell-type" className="text-xs uppercase tracking-wider text-muted-foreground">
          Shell Type
        </Label>
        <Select value={shellType} onValueChange={setShellType}>
          <SelectTrigger id="shell-type" className="w-full font-[var(--font-mono)]">
            <SelectValue placeholder="Select shell type" />
          </SelectTrigger>
          <SelectContent>
            {sortedShells.map((shell) => (
              <SelectItem
                key={shell}
                value={shell}
                className="font-[var(--font-mono)]"
              >
                {capitalizeShellName(shell)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      {showDescriptionField ? (
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">
            Description
          </Label>
          <Textarea
            ref={descriptionRef}
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Describe what this snippet does..."
            className="min-h-[80px]"
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
          disabled={isPending || !name.trim() || !content.trim()}
          className="bg-success hover:bg-success/90 text-black"
        >
          {isPending
            ? mode === 'create' ? 'Creating...' : 'Saving...'
            : mode === 'create' ? 'Create Snippet' : 'Save Changes'}
        </Button>
      </div>

      {/* Template Confirmation Dialog */}
      <AlertDialog open={showTemplateConfirm} onOpenChange={setShowTemplateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current content with the selected template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTemplate}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTemplate}>Replace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
