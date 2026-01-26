import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTags, useCreateTag, useAddTagToSnippet, useRemoveTagFromSnippet } from '@/hooks/useTags';
import { Plus, Tag as TagIcon, Loader2 } from 'lucide-react';
import type { Tag } from '@/types/snippet';
import { cn } from '@/lib/utils';

// Predefined colors for tags
const TAG_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

interface TagPickerProps {
  snippetId: number;
  currentTags: Tag[];
}

export function TagPicker({ snippetId, currentTags }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const { tags, loading: tagsLoading } = useTags();
  const { mutate: createTag, isPending: isCreating } = useCreateTag();
  const { mutate: addTag, isPending: isAdding } = useAddTagToSnippet();
  const { mutate: removeTag, isPending: isRemoving } = useRemoveTagFromSnippet();

  const currentTagIds = new Set(currentTags.map((t) => t.id));
  const isPending = isCreating || isAdding || isRemoving;

  const handleToggleTag = (tag: Tag) => {
    if (currentTagIds.has(tag.id)) {
      removeTag({ snippetId, tagId: tag.id });
    } else {
      addTag({ snippetId, tagId: tag.id });
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    createTag(
      { name: newTagName.trim(), color: selectedColor },
      {
        onSuccess: (newTag) => {
          // Also add the new tag to this snippet
          addTag({ snippetId, tagId: newTag.id });
          setNewTagName('');
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3 h-3 mr-1" />
          Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags</span>
          </div>

          {/* Existing tags */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {tagsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No tags yet. Create one below.
              </p>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                    'hover:bg-accent'
                  )}
                >
                  <Checkbox
                    checked={currentTagIds.has(tag.id)}
                    onCheckedChange={() => handleToggleTag(tag)}
                    disabled={isPending}
                    className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                  />
                  <Badge
                    variant="secondary"
                    className="text-xs font-[var(--font-mono)]"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      borderColor: tag.color ? `${tag.color}40` : undefined,
                      color: tag.color || undefined,
                    }}
                  >
                    {tag.name}
                  </Badge>
                </label>
              ))
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Create new tag */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Create new tag
            </span>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tag name"
                className="h-8 text-sm font-[var(--font-mono)]"
                disabled={isPending}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isPending}
                className="h-8 px-2 bg-success hover:bg-success/90 text-black"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Color picker */}
            <div className="flex gap-1.5 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    selectedColor === color && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
