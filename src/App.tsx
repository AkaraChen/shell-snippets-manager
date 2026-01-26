import { useState, useMemo, Suspense } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { SnippetList } from '@/components/SnippetList';
import { CreateSnippetDialog } from '@/components/CreateSnippetDialog';
import { EditSnippetDialog } from '@/components/EditSnippetDialog';
import { useSnippets } from '@/hooks/useSnippets';
import { useShellInfo } from '@/hooks/useShellInfo';
import type { Snippet } from '@/types/snippet';

function AppContent() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const { snippets, loading, toggleSnippet, deleteSnippet, reorderSnippets } = useSnippets();
  const { available_shells, default_shell } = useShellInfo();
  const [selectedShell, setSelectedShell] = useState(default_shell);

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
  };

  const handleDelete = async (id: number) => {
    await deleteSnippet(id);
  };

  const filteredSnippets = useMemo(
    () => snippets.filter((s) => s.shell_type === selectedShell),
    [snippets, selectedShell]
  );

  const sortedShells = useMemo(() => {
    const others = available_shells.filter((s) => s !== default_shell).sort();
    return [default_shell, ...others];
  }, [available_shells, default_shell]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background text-foreground">
        <Header
          onCreateClick={() => setCreateDialogOpen(true)}
          selectedShell={selectedShell}
          availableShells={sortedShells}
          onShellChange={setSelectedShell}
        />

        <main className="container mx-auto px-4 py-6 max-w-3xl">
          <SnippetList
            snippets={filteredSnippets}
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

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AppContent />
    </Suspense>
  );
}

export default App;
