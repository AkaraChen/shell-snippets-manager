import { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import ShikiHighlighter from 'react-shiki';
import { useHelpData } from '@/hooks/useHelpData';
import { syncApi } from '@/api/snippets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShellConfig {
  name: string;
  icon: string;
  rcFile: string;
  filename: string;
  language: string;
}

const SHELL_CONFIGS: Record<string, ShellConfig> = {
  bash: {
    name: 'Bash',
    icon: '$',
    rcFile: '~/.bashrc',
    filename: 'snippets-manager-bash.sh',
    language: 'bash',
  },
  zsh: {
    name: 'Zsh',
    icon: '$',
    rcFile: '~/.zshrc',
    filename: 'snippets-manager-zsh.sh',
    language: 'zsh',
  },
  fish: {
    name: 'Fish',
    icon: '><>',
    rcFile: '~/.config/fish/config.fish',
    filename: 'snippets-manager-fish.fish',
    language: 'fish',
  },
  sh: {
    name: 'POSIX sh',
    icon: '$',
    rcFile: '~/.profile',
    filename: 'snippets-manager-sh.sh',
    language: 'shellscript',
  },
  powershell: {
    name: 'PowerShell',
    icon: 'PS>',
    rcFile: '$PROFILE',
    filename: 'snippets-manager-powershell.ps1',
    language: 'powershell',
  },
};

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HelpDialogContent() {
  const { helpData, sortedShells, defaultShell } = useHelpData();

  // Filter shells to only include those with config
  const supportedShells = sortedShells.filter(shell => shell in SHELL_CONFIGS);

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy');
    }
  };

  const handleOpenDirectory = async () => {
    try {
      await syncApi.openOutputDirectory();
      toast.success('Opening directory');
    } catch (error) {
      console.error('Failed to open directory:', error);
      toast.error('Failed to open directory');
    }
  };

  const handleOpenConfigFile = async (filePath: string) => {
    try {
      // Copy file path to clipboard
      await navigator.clipboard.writeText(filePath);

      // Open in editor
      await syncApi.openFileInEditor(filePath);

      // Show success toast with copied path
      toast.success('Copied file path and opening in editor', {
        description: filePath,
      });
    } catch (error) {
      console.error('Failed to open file:', error);
      toast.error('Failed to open file in editor');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-[var(--font-mono)]">
          Help: Sourcing Shell Snippets
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue={defaultShell} className="w-full min-w-0">
          <TabsList className={cn(
            "grid w-full",
            supportedShells.length === 2 && "grid-cols-2",
            supportedShells.length === 3 && "grid-cols-3",
            supportedShells.length === 4 && "grid-cols-4",
            supportedShells.length === 5 && "grid-cols-5"
          )}>
            {supportedShells.map((shellType) => {
              const config = SHELL_CONFIGS[shellType];
              return (
                <TabsTrigger
                  key={shellType}
                  value={shellType}
                  className="text-xs"
                >
                  <span className="font-[var(--font-mono)] text-success mr-1">
                    {config.icon}
                  </span>
                  {config.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {supportedShells.map((shellType) => {
            const config = SHELL_CONFIGS[shellType];
            const sourceLine = helpData.sourceLines[shellType];

            return (
              <TabsContent
                key={shellType}
                value={shellType}
                className="space-y-3 mt-3 min-w-0"
              >
                <div className="space-y-3 w-full min-w-0">
                  {/* Instruction text */}
                  <p className="text-sm text-foreground">
                    Add these lines to your{' '}
                    <button
                      onClick={() => handleOpenConfigFile(config.rcFile)}
                      className="font-[var(--font-mono)] text-success hover:underline focus:outline-none"
                    >
                      {config.rcFile}
                    </button>:
                  </p>

                  {/* Code block - clickable to copy */}
                  <div
                    onClick={() => handleCopyCode(sourceLine)}
                    className={cn(
                      'rounded-md overflow-x-auto w-full min-w-0 max-w-full cursor-pointer',
                      'bg-code-bg border border-code-border',
                      'hover:border-success/50 transition-colors'
                    )}
                  >
                    <div className="p-2 code-scrollbar text-xs [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!bg-transparent [&_.shiki]:!bg-transparent [&_pre]:!max-w-none">
                      <ShikiHighlighter language={config.language} theme="vitesse-dark">
                        {sourceLine}
                      </ShikiHighlighter>
                    </div>
                  </div>

                  {/* Helper text with link */}
                  <p className="text-sm text-muted-foreground">
                    Click the code block above to copy. If you'd like to{' '}
                    <button
                      onClick={handleOpenDirectory}
                      className="text-success hover:underline focus:outline-none"
                    >
                      inspect
                    </button>
                    {' '}the generated shell scripts, they're saved in your output directory.
                  </p>
                </div>
              </TabsContent>
            );
          })}
      </Tabs>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-code-border max-h-[85vh] overflow-y-auto">
        <Suspense fallback={<LoadingFallback />}>
          <HelpDialogContent />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
