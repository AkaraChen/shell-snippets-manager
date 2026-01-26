import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpDialog } from './HelpDialog';

export function HelpButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="gap-2 border-code-border hover:border-success/50 hover:bg-success/5"
      >
        <HelpCircle className="w-4 h-4" />
        Help
      </Button>

      <HelpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
