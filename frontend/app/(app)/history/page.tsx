'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronDown, Trash2 } from 'lucide-react';
import {
  deleteHistory,
  fetchHistory,
  type ChangelogRecord,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Markdown } from '@/components/Markdown';

export default function HistoryPage() {
  const { data: session } = useSession();
  const userId = session?.githubId;

  const [records, setRecords] = useState<ChangelogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await fetchHistory(uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) load(userId);
  }, [userId]);

  const remove = async (id: string) => {
    if (!userId) return;
    const prev = records;
    setRecords((r) => r.filter((x) => x.id !== id)); // optimistic
    try {
      await deleteHistory(userId, id);
    } catch (e) {
      setRecords(prev); // rollback
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          Previously generated changelogs.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : records.length === 0 ? (
        <p className="text-muted-foreground">
          No changelogs yet. Generate one to see it here.
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="flex min-w-0 items-center gap-2 text-left"
                    onClick={() => setOpen(open === rec.id ? null : rec.id)}
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        open === rec.id ? 'rotate-180' : ''
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{rec.repo_name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(rec.created_at).toLocaleString()}
                        {rec.branch ? ` · ${rec.branch}` : ''}
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(rec.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {open === rec.id && (
                  <div className="mt-4 border-t border-border pt-4">
                    <Markdown content={rec.content} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
