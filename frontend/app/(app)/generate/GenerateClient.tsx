"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  GitCommitHorizontal,
  Loader2,
} from "lucide-react";
import {
  fetchCommits,
  fetchRepos,
  streamChangelog,
  type Commit,
  type Repo,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RepoSelector } from "@/components/RepoSelector";
import { CommitRangePicker } from "@/components/CommitRangePicker";
import { ChangelogOutput } from "@/components/ChangelogOutput";
import { Notice, PageIntro } from "@/components/WorkspaceUI";
import { SegmentedControl } from "@/components/SegmentedControl";

const STYLES = [
  { value: "professional", label: "Professional" },
  { value: "concise", label: "Concise" },
  { value: "playful", label: "Playful" },
] as const;
type Style = (typeof STYLES)[number]["value"];
const styleDescriptions: Record<Style, string> = {
  professional: "Clear, polished, and ready for your customers.",
  concise: "Just the essentials. Easy to scan and share.",
  playful: "A little personality. The same useful details.",
};
const isoBound = (value: string, end = false) =>
  value
    ? new Date(`${value}T${end ? "23:59:59" : "00:00:00"}Z`).toISOString()
    : undefined;

export default function GenerateClient() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const token = session?.accessToken;
  const wantedRepo = params.get("repo");
  const wantedBranch = params.get("branch");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selected, setSelected] = useState<Repo | null>(null);
  const [branch, setBranch] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [style, setStyle] = useState<Style>("professional");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [changelog, setChangelog] = useState("");
  const [outputRepo, setOutputRepo] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoAttempt, setRepoAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoadingRepos(false);
      return;
    }
    setLoadingRepos(true);
    fetchRepos(token)
      .then((list) => {
        if (!active) return;
        setRepos(list);
        const match = wantedRepo
          ? list.find((repo) => repo.fullName === wantedRepo)
          : null;
        if (match) {
          setSelected(match);
          setBranch(wantedBranch ?? match.defaultBranch);
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Couldn’t load repositories. Please try again.",
          );
      })
      .finally(() => {
        if (active) setLoadingRepos(false);
      });
    return () => {
      active = false;
    };
  }, [token, wantedRepo, wantedBranch, repoAttempt]);
  useEffect(
    () => () => {
      abortRef.current?.abort();
      requestVersion.current += 1;
    },
    [],
  );

  const invalidateCommits = () => {
    requestVersion.current += 1;
    setCommits([]);
    setLoaded(false);
    setLoadingCommits(false);
    setError(null);
  };
  const onSelectRepo = (repo: Repo) => {
    invalidateCommits();
    setSelected(repo);
    setBranch(repo.defaultBranch);
  };
  const invalidDates = Boolean(since && until && since > until);
  const loadCommits = async () => {
    if (!token || !selected || invalidDates) return;
    const version = ++requestVersion.current;
    setLoadingCommits(true);
    setLoaded(false);
    setCommits([]);
    setError(null);
    try {
      const list = await fetchCommits(token, {
        repo: selected.fullName,
        branch: branch || selected.defaultBranch,
        since: isoBound(since),
        until: isoBound(until, true),
      });
      if (version !== requestVersion.current) return;
      setCommits(list);
      setLoaded(true);
    } catch (e) {
      if (version === requestVersion.current)
        setError(
          e instanceof Error
            ? e.message
            : "Couldn’t load commits. Check the branch and try again.",
        );
    } finally {
      if (version === requestVersion.current) setLoadingCommits(false);
    }
  };
  const generate = async () => {
    if (
      !selected ||
      !session?.githubId ||
      commits.length === 0 ||
      streaming ||
      loadingCommits
    )
      return;
    setStreaming(true);
    setChangelog("");
    setOutputRepo(selected.fullName);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamChangelog(
        {
          repoName: selected.fullName,
          branch: branch || selected.defaultBranch,
          dateFrom: isoBound(since),
          dateTo: isoBound(until, true),
          style,
          userId: session.githubId,
          commits: commits.map(({ sha, message, author, date }) => ({
            sha,
            message,
            author,
            date,
          })),
        },
        (delta) => setChangelog((previous) => previous + delta),
        controller.signal,
      );
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError(
          e instanceof Error
            ? e.message
            : "Couldn’t finish the draft. Please try again.",
        );
    } finally {
      if (!controller.signal.aborted) setStreaming(false);
    }
  };
  const canGenerate = Boolean(
    selected &&
    session?.githubId &&
    commits.length > 0 &&
    !streaming &&
    !loadingCommits &&
    !invalidDates,
  );

  return (
    <>
      <PageIntro
        title="Good changes. Better words."
        description="Choose what changed. We’ll help you tell the story."
      />
      {error && (
        <Notice
          title="Something needs another try."
          onRetry={
            !repos.length
              ? () => {
                  setError(null);
                  setRepoAttempt((value) => value + 1);
                }
              : undefined
          }
        >
          {error}
        </Notice>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)] xl:gap-12">
        <div className="min-w-0">
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
              1
            </span>
            <h2 className="text-sm font-medium">Choose your changes</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="field-label">Repository</p>
              <RepoSelector
                repos={repos}
                selected={selected}
                onSelect={onSelectRepo}
                disabled={streaming}
                loading={loadingRepos}
              />
            </div>
            <CommitRangePicker
              branch={branch}
              defaultBranch={selected?.defaultBranch ?? "main"}
              since={since}
              until={until}
              disabled={streaming}
              onChange={(next) => {
                invalidateCommits();
                if (next.branch !== undefined) setBranch(next.branch);
                if (next.since !== undefined) setSince(next.since);
                if (next.until !== undefined) setUntil(next.until);
              }}
            />
            {invalidDates && (
              <p role="alert" className="text-sm text-destructive">
                The end date needs to be on or after the start date.
              </p>
            )}
            <Button
              variant="outline"
              onClick={loadCommits}
              className="w-full"
              disabled={
                !selected || loadingCommits || streaming || invalidDates
              }
            >
              {loadingCommits ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <GitCommitHorizontal className="h-4 w-4" aria-hidden="true" />
              )}
              {loadingCommits
                ? "Finding your commits…"
                : loaded
                  ? "Reload commits"
                  : "Load commits"}
            </Button>
            {loaded && (
              <div
                role="status"
                className="!mt-3 text-xs leading-relaxed text-muted-foreground"
              >
                {commits.length ? (
                  <span className="flex items-center gap-1.5 text-primary">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {commits.length}{" "}
                    {commits.length === 1 ? "commit" : "commits"} ready to turn
                    into a story.
                  </span>
                ) : (
                  "No commits in this range. Try another branch or a wider date range."
                )}
                {commits.length === 100 && (
                  <p className="mt-2">
                    Showing the latest 100 commits. Narrow the dates for a more
                    focused release.
                  </p>
                )}
              </div>
            )}
            {commits.length > 0 && (
              <details className="repo-picker border-t border-border pt-3">
                <summary className="flex min-h-9 cursor-pointer items-center justify-between text-xs text-muted-foreground">
                  Review selected commits
                  <ChevronDown
                    className="picker-chevron h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="mt-2 max-h-52 space-y-3 overflow-y-auto py-2">
                  {commits.map((commit) => (
                    <li key={commit.sha} className="flex items-start gap-2">
                      <GitCommitHorizontal
                        className="mt-0.5 h-3.5 w-3.5 text-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="break-words text-xs leading-relaxed">
                          {commit.message.split("\n")[0]}
                        </p>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {commit.sha.slice(0, 7)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <div className="mb-5 mt-6 flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
              2
            </span>
            <h2 className="text-sm font-medium">Make it sound like you</h2>
          </div>
          <div>
            <p className="field-label">Writing style</p>
            <SegmentedControl
              label="Writing style"
              value={style}
              onChange={setStyle}
              options={STYLES}
              disabled={streaming}
            />
            <p className="mt-3 min-h-8 text-xs leading-relaxed text-muted-foreground">
              {styleDescriptions[style]}
            </p>
          </div>
          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={generate}
            disabled={!canGenerate}
          >
            {streaming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Writing your changelog…
              </>
            ) : (
              <>
                Generate changelog
                <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            {!selected
              ? "Start by choosing a repository above."
              : !loaded
                ? "Load your commits to unlock the first draft."
                : "A first draft from AI. The final word is yours."}
          </p>
        </div>
        <ChangelogOutput
          content={changelog}
          repoName={outputRepo || selected?.fullName}
          streaming={streaming}
        />
      </div>
    </>
  );
}
