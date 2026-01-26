import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Header } from '@/components/Header';
import { SnippetList } from '@/components/SnippetList';
import { CreateSnippetDialog } from '@/components/CreateSnippetDialog';
import { useSnippets } from '@/hooks/useSnippets';

function App() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { snippets, loading, toggleSnippet, reorderSnippets } = useSnippets();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background text-foreground">
        <Header onCreateClick={() => setCreateDialogOpen(true)} />

        <main className="container mx-auto px-4 py-6 max-w-3xl">
          <SnippetList
            snippets={snippets}
            loading={loading}
            onToggle={toggleSnippet}
            onReorder={reorderSnippets}
          />
        </main>

        <CreateSnippetDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </DndProvider>
  );
}

export default App;
