import { useState } from 'react';
import { Header } from '@/components/Header';
import { SnippetList } from '@/components/SnippetList';
import { CreateSnippetDialog } from '@/components/CreateSnippetDialog';
import { useSnippets } from '@/hooks/useSnippets';

function App() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { snippets, loading, toggleSnippet } = useSnippets();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onCreateClick={() => setCreateDialogOpen(true)} />

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <SnippetList
          snippets={snippets}
          loading={loading}
          onToggle={toggleSnippet}
        />
      </main>

      <CreateSnippetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}

export default App;
