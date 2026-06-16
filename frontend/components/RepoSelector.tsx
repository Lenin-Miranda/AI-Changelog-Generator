'use client';

import { useMemo, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import type { Repo } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props {
  repos: Repo[];
  selected: Repo | null;
  onSelect: (repo: Repo) => void;
}

export function RepoSelector({ repos, selected, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return repos.filter((r) => r.fullName.toLowerCase().includes(q));
  }, [repos, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search repositories…"
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
        {filtered.map((repo) => (
          <button
            key={repo.id}
            onClick={() => onSelect(repo)}
            className={cn(
              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors',
              selected?.id === repo.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-muted',
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {repo.private && (
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{repo.fullName}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {repo.defaultBranch}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-1 py-4 text-sm text-muted-foreground">
            No repositories match “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}
