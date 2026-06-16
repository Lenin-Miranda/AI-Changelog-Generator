'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GitCommit, Loader2, Sparkles } from 'lucide-react';
import {
  fetchCommits,
  fetchRepos,
  streamChangelog,
  type Commit,
  type Repo,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RepoSelector } from '@/components/RepoSelector';
import { CommitRangePicker } from '@/components/CommitRangePicker';
import { ChangelogOutput } from '@/components/ChangelogOutput';

const STYLES = ['professional', 'concise', 'playful'] as const;
type Style = (typeof STYLES)[number];

export default function GenerateClient() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const token = session?.accessToken;

  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState<Repo | null>(null);
  const [branch, setBranch] = useState('');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [style, setStyle] = useState<Style>('professional');

  const [commits, setCommits] = useState<Commit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load repo list and preselect the one passed from the dashboard.
  useEffect(() => {
    if (!token) return;
    fetchRepos(token)
      .then((list) => {
        setRepos(list);
        const wanted = params.get('repo');
        const match = wanted ? list.find((r) => r.fullName === wanted) : null;
        if (match) {
          setSelected(match);
          setBranch(params.get('branch') ?? match.defaultBranch);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load repos'));
  }, [token, params]);

  const onSelectRepo = (repo: Repo) => {
    setSelected(repo);
    setBranch(repo.defaultBranch);
    setCommits([]);
    setChangelog('');
  };

  const isoBound = (d: string, end = false) =>
    d ? new Date(`${d}T${end ? '23:59:59' : '00:00:00'}Z`).toISOString() : undefined;

  const loadCommits = async () => {
    if (!token || !selected) return;
    setLoadingCommits(true);
    setError(null);
    try {
      const list = await fetchCommits(token, {
        repo: selected.fullName,
        branch: branch || selected.defaultBranch,
        since: isoBound(since),
        until: isoBound(until, true),
      });
      setCommits(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load commits');
    } finally {
      setLoadingCommits(false);
    }
  };

  const generate = async () => {
    if (!selected || !session?.githubId || commits.length === 0) return;
    setStreaming(true);
    setChangelog('');
    setError(null);
    abortRef.current = new AbortController();

    try {
      await streamChangelog(
        {
          repoName: selected.fullName,
          branch: branch || selected.defaultBranch,
          dateFrom: isoBound(since),
          dateTo: isoBound(until, true),
          style,
          userId: session.githubId,
          commits: commits.map((c) => ({
            sha: c.sha,
            message: c.message,
            author: c.author,
            date: c.date,
          })),
        },
        (delta) => setChangelog((prev) => prev + delta),
        abortRef.current.signal,
      );
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'Generation failed');
      }
    } finally {
      setStreaming(false);
    }
  };

  const canGenerate = useMemo(
    () => !!selected && commits.length > 0 && !streaming,
    [selected, commits.length, streaming],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Generate changelog</h1>
        <p className="text-sm text-muted-foreground">
          Choose a repository, a commit range, and a tone.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <RepoSelector repos={repos} selected={selected} onSelect={onSelectRepo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Range &amp; style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <CommitRangePicker
              branch={branch}
              defaultBranch={selected?.defaultBranch ?? 'main'}
              since={since}
              until={until}
              onChange={(n) => {
                if (n.branch !== undefined) setBranch(n.branch);
                if (n.since !== undefined) setSince(n.since);
                if (n.until !== undefined) setUntil(n.until);
              }}
            />

            <div className="space-y-1.5">
              <span className="text-sm text-muted-foreground">Tone</span>
              <div className="flex gap-2">
                {STYLES.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={style === s ? 'primary' : 'outline'}
                    onClick={() => setStyle(s)}
                    className="capitalize"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={loadCommits} disabled={!selected || loadingCommits}>
                {loadingCommits ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GitCommit className="h-4 w-4" />
                )}
                Load commits
              </Button>
              {commits.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {commits.length} commit{commits.length === 1 ? '' : 's'} found
                </span>
              )}
            </div>

            <Button onClick={generate} disabled={!canGenerate} className="w-full">
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate changelog
            </Button>
          </CardContent>
        </Card>
      </div>

      <ChangelogOutput
        content={changelog}
        repoName={selected?.fullName}
        streaming={streaming}
      />
    </div>
  );
}
