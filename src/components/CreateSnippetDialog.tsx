import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useCreateSnippet } from '@/hooks/useCreateSnippet';
import type { ShellType } from '@/types/snippet';
import { Terminal, Plus } from 'lucide-react';

interface CreateSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHELL_TYPES: { value: ShellType; label: string }[] = [
  { value: 'bash', label: 'Bash' },
  { value: 'zsh', label: 'Zsh' },
  { value: 'fish', label: 'Fish' },
  { value: 'sh', label: 'POSIX Shell (sh)' },
  { value: 'powershell', label: 'PowerShell' },
];

export function CreateSnippetDialog({
  open,
  onOpenChange,
}: CreateSnippetDialogProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [shellType, setShellType] = useState<ShellType>('bash');
  const [description, setDescription] = useState('');
  const [showDescriptionField, setShowDescriptionField] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: createSnippet, isPending } = useCreateSnippet();

  const resetForm = () => {
    setName('');
    setContent('');
    setShellType('bash');
    setDescription('');
    setShowDescriptionField(false);
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

    if (!name.trim() || !content.trim()) return;

    createSnippet(
      {
        name: name.trim(),
        content: content.trim(),
        shell_type: shellType,
        description: description.trim() || null,
        enabled: 1,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg border-[var(--code-border)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-[var(--font-mono)]">
            <Terminal className="w-5 h-5 text-[var(--terminal-green)]" />
            Create Snippet
          </DialogTitle>
        </DialogHeader>

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
            <Label htmlFor="content" className="text-xs uppercase tracking-wider text-muted-foreground">
              Command / Code *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="alias ll='ls -la'"
              className="font-[var(--font-mono)] min-h-[120px] bg-[var(--code-bg)] text-[var(--terminal-green)] border-[var(--code-border)] placeholder:text-[var(--terminal-dim)]"
              required
            />
          </div>

          {/* Shell Type */}
          <div className="space-y-2">
            <Label htmlFor="shell-type" className="text-xs uppercase tracking-wider text-muted-foreground">
              Shell Type
            </Label>
            <Select value={shellType} onValueChange={(v) => setShellType(v as ShellType)}>
              <SelectTrigger id="shell-type" className="w-full font-[var(--font-mono)]">
                <SelectValue placeholder="Select shell type" />
              </SelectTrigger>
              <SelectContent>
                {SHELL_TYPES.map((shell) => (
                  <SelectItem
                    key={shell.value}
                    value={shell.value}
                    className="font-[var(--font-mono)]"
                  >
                    {shell.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          {showDescriptionField ? (
            <div className="space-y-2">
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

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim() || !content.trim()}
              className="bg-[var(--terminal-green)] hover:bg-[var(--terminal-green)]/90 text-black"
            >
              {isPending ? 'Creating...' : 'Create Snippet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
