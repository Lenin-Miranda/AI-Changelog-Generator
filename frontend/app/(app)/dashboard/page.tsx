'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { fetchRepos, type Repo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      setRepos(await fetchRepos(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) load(session.accessToken);
  }, [session?.accessToken]);

  const pick = (repo: Repo) => {
    router.push(`/generate?repo=${encodeURIComponent(repo.fullName)}&branch=${encodeURIComponent(repo.defaultBranch)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your repositories</h1>
          <p className="text-sm text-muted-foreground">
            Pick a repository to generate a changelog.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || !session?.accessToken}
          onClick={() => session?.accessToken && load(session.accessToken)}
        >
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading repositories…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {repos.map((repo) => (
            <Card key={repo.id} className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {repo.private && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="truncate font-medium">{repo.fullName}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {repo.description ?? 'No description'}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => pick(repo)}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
