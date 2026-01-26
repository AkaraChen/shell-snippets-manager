import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'sonner';
import { Header } from '@/components/Header';
import { SnippetList } from '@/components/SnippetList';
import { CreateSnippetDialog } from '@/components/CreateSnippetDialog';
import { EditSnippetDialog } from '@/components/EditSnippetDialog';
import { useSnippets } from '@/hooks/useSnippets';
import type { Snippet } from '@/types/snippet';

function App() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const { snippets, loading, toggleSnippet, deleteSnippet, reorderSnippets } = useSnippets();

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
  };

  const handleDelete = async (id: number) => {
    await deleteSnippet(id);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background text-foreground">
        <Header onCreateClick={() => setCreateDialogOpen(true)} />

        <main className="container mx-auto px-4 py-6 max-w-3xl">
          <SnippetList
            snippets={snippets}
            loading={loading}
            onToggle={toggleSnippet}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReorder={reorderSnippets}
          />
        </main>

        <CreateSnippetDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        <EditSnippetDialog
          snippet={editingSnippet}
          open={!!editingSnippet}
          onOpenChange={(open) => !open && setEditingSnippet(null)}
        />

        <Toaster position="bottom-right" />
      </div>
    </DndProvider>
  );
}

export default App;
