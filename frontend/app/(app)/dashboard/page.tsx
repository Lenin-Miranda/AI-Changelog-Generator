"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BookOpen,
  GitBranch,
  Github,
  LockKeyhole,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { fetchRepos, type Repo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ListSkeleton,
  Notice,
  PageIntro,
} from "@/components/WorkspaceUI";

function updatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently updated"
    : `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your GitHub session is missing. Sign out and connect again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRepos(await fetchRepos(token));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = repos.filter((repo) =>
    `${repo.fullName} ${repo.description ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <PageIntro
        title="What have you been building?"
        description="Choose a repository. Turn the work behind your next release into words worth sharing."
        action={
          <Button variant="outline" size="sm" disabled={loading} onClick={load}>
            <RefreshCw
              className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />
      {error && (
        <Notice title="We couldn’t load your repositories." onRetry={load}>
          {error}
        </Notice>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search repositories"
            className="field pl-10 pr-10"
            placeholder="Find a repository…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {!loading && !error && (
          <p
            className="flex items-center gap-2 text-xs text-muted-foreground"
            role="status"
          >
            <Github className="h-3.5 w-3.5" aria-hidden="true" />
            {filtered.length}{" "}
            {filtered.length === 1 ? "repository" : "repositories"}
            {query ? " found" : " from GitHub"}
          </p>
        )}
      </div>
      {loading ? (
        <ListSkeleton count={5} />
      ) : repos.length === 0 && !error ? (
        <div className="surface">
          <EmptyState
            icon={Github}
            title="Your next project starts here."
            description="We couldn’t find any repositories for this account. Create one on GitHub, then refresh this list."
            action={
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noreferrer"
                className="text-link text-primary"
              >
                Create a repository
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            }
          />
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="surface">
          <EmptyState
            icon={Search}
            title="No matching repositories."
            description="Try a shorter name or search by the repository owner."
            action={
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        </div>
      ) : repos.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden grid-cols-[1fr_170px_130px_32px] gap-5 border-b border-border bg-card px-6 py-3 text-xs text-muted-foreground md:grid">
            <span>Repository</span>
            <span>Default branch</span>
            <span>Last activity</span>
            <span className="sr-only">Open</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((repo) => (
              <li key={repo.id}>
                <Link
                  href={`/generate?repo=${encodeURIComponent(repo.fullName)}&branch=${encodeURIComponent(repo.defaultBranch)}`}
                  className="repo-row grid grid-cols-[1fr_24px] items-center gap-5 px-4 py-6 focus-visible:outline-offset-[-3px] sm:px-6 md:grid-cols-[1fr_170px_130px_32px]"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/70 sm:flex">
                      <BookOpen
                        className="h-[18px] w-[18px] text-primary"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-medium sm:text-[15px]">
                          {repo.fullName}
                        </h2>
                        {repo.private && (
                          <LockKeyhole
                            className="h-3.5 w-3.5 text-muted-foreground"
                            aria-label="Private repository"
                          />
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">
                        {repo.description ?? "Ready for its next chapter."}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground md:hidden">
                        <GitBranch className="h-3 w-3" aria-hidden="true" />
                        {repo.defaultBranch}
                      </span>
                    </div>
                  </div>
                  <span className="hidden min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground md:flex">
                    <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="truncate">{repo.defaultBranch}</span>
                  </span>
                  <span className="hidden text-xs text-muted-foreground md:block">
                    {updatedAt(repo.updatedAt)}
                  </span>
                  <ArrowRight
                    className="repo-arrow h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Showing repositories available to your GitHub account. Choose one to set
        a branch and date range.
      </p>
    </>
  );
}
