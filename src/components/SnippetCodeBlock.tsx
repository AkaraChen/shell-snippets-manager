import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import ShikiHighlighter from 'react-shiki';
import type { ShellType } from '@/types/snippet';
import { cn } from '@/lib/utils';

interface SnippetCodeBlockProps {
  content: string;
  shellType: ShellType;
  className?: string;
}

const shellToLanguage: Record<ShellType, string> = {
  bash: 'bash',
  zsh: 'zsh',
  sh: 'shellscript',
  fish: 'fish',
  powershell: 'powershell',
};

export function SnippetCodeBlock({ content, shellType, className }: SnippetCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = shellToLanguage[shellType];

  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden',
        'bg-code-bg border border-code-border',
        className
      )}
    >
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          'absolute top-2 right-2 z-10 p-1.5 rounded-md',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'bg-muted-foreground/20 hover:bg-muted-foreground/40',
          'text-muted-foreground hover:text-success',
          'focus:outline-none focus:ring-1 focus:ring-success/50'
        )}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>

      {/* Code content with syntax highlighting */}
      <div className="p-4 overflow-x-auto code-scrollbar [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!bg-transparent [&_.shiki]:!bg-transparent">
        <ShikiHighlighter language={language} theme="vitesse-dark">
          {content}
        </ShikiHighlighter>
      </div>
    </div>
  );
}
