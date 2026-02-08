import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { NewAlias } from '@/types/snippet';

interface AliasFormProps {
  onSubmit: (data: NewAlias) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function AliasForm({ onSubmit, onCancel, isPending }: AliasFormProps) {
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [description, setDescription] = useState('');
  const [showDescriptionField, setShowDescriptionField] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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
    if (!name.trim() || !command.trim()) return;

    onSubmit({
      name: name.trim(),
      command: command.trim(),
      description: description.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="alias-name" className="text-xs uppercase tracking-wider text-muted-foreground">
          Name *
        </Label>
        <Input
          id="alias-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., ll"
          className="font-(--font-mono)"
          required
        />
      </div>

      {/* Command */}
      <div className="space-y-2">
        <Label htmlFor="alias-command" className="text-xs uppercase tracking-wider text-muted-foreground">
          Command *
        </Label>
        <Input
          id="alias-command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., ls -la"
          className="font-(--font-mono)"
          required
        />
      </div>

      {/* Description */}
      {showDescriptionField ? (
        <div className="space-y-2">
          <Label htmlFor="alias-description" className="text-xs uppercase tracking-wider text-muted-foreground">
            Description
          </Label>
          <Textarea
            ref={descriptionRef}
            id="alias-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Describe what this alias does..."
            className="min-h-20"
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
          disabled={isPending || !name.trim() || !command.trim()}
          className="bg-success hover:bg-success/90 text-black"
        >
          {isPending ? 'Creating...' : 'Create Alias'}
        </Button>
      </div>
    </form>
  );
}
