'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/Markdown';

interface Props {
  content: string;
  repoName?: string;
  streaming?: boolean;
}

// Slack uses *bold* (single asterisk) and no headings — downconvert Markdown.
function toSlack(md: string): string {
  return md
    .replace(/^#{1,6}\s*(.*)$/gm, '*$1*')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/^[-*]\s/gm, '• ');
}

// Notion pastes Markdown well; strip emojis-only lines? Keep as-is, it's fine.
function toNotion(md: string): string {
  return md;
}

export function ChangelogOutput({ content, repoName, streaming }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const download = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName?.replace('/', '-') ?? 'changelog'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CopyButton = ({ label, text }: { label: string; text: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copy(label, text)}
      disabled={!content || streaming}
    >
      {copied === label ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {label}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <CopyButton label="Copy Markdown" text={content} />
        <CopyButton label="Copy for Notion" text={toNotion(content)} />
        <CopyButton label="Copy for Slack" text={toSlack(content)} />
        <Button
          variant="outline"
          size="sm"
          onClick={download}
          disabled={!content || streaming}
        >
          <Download className="h-4 w-4" />
          Download .md
        </Button>
      </div>

      <div className="min-h-[200px] rounded-lg border border-border bg-card p-6">
        {content ? (
          <Markdown content={content} />
        ) : (
          <p className="text-muted-foreground">
            Your generated changelog will appear here.
          </p>
        )}
        {streaming && (
          <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-primary align-middle" />
        )}
      </div>
    </div>
  );
}
