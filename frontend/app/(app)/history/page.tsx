"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, m } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  FileText,
  GitBranch,
  History,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { deleteHistory, fetchHistory, type ChangelogRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChangelogOutput } from "@/components/ChangelogOutput";
import {
  EmptyState,
  ListSkeleton,
  Notice,
  PageIntro,
} from "@/components/WorkspaceUI";

export default function HistoryPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [records, setRecords] = useState<ChangelogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your session is missing. Sign out and connect GitHub again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRecords(await fetchHistory(token));
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
  const remove = async (id: string) => {
    if (!token || deleting) return;
    setDeleting(id);
    setError(null);
    try {
      await deleteHistory(token, id);
      setRecords((previous) => previous.filter((record) => record.id !== id));
      setConfirmDelete(null);
      if (open === id) setOpen(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn’t delete this changelog. Please try again.",
      );
    } finally {
      setDeleting(null);
    }
  };
  const filtered = records.filter((record) =>
    `${record.repo_name} ${record.branch ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <PageIntro
        title="A record of what’s changed."
        description="Your previous drafts, ready to revisit, copy, or share again."
        action={
          <Link href="/generate" className="text-link text-primary">
            New changelog
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
      {error && (
        <Notice title="We couldn’t complete that request." onRetry={load}>
          {error}
        </Notice>
      )}
      {loading ? (
        <ListSkeleton />
      ) : records.length === 0 && !error ? (
        <div className="surface">
          <EmptyState
            icon={History}
            title="Your story is just getting started."
            description="Once you generate and save a changelog, you’ll find it here. Let’s write the first one."
            action={
              <Link
                href="/generate"
                className="button inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Create a changelog
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        </div>
      ) : records.length > 0 ? (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search saved changelogs"
                className="field pl-10"
                placeholder="Find a repository or branch…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <p role="status" className="text-xs text-muted-foreground">
              {filtered.length}{" "}
              {filtered.length === 1 ? "changelog" : "changelogs"}
            </p>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nothing matches just yet."
              description="Try another repository or branch name."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {filtered.map((record) => (
                  <m.li
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    className="overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-2 px-4 py-4 sm:px-5">
                      <button
                        type="button"
                        aria-expanded={open === record.id}
                        aria-controls={`changelog-${record.id}`}
                        onClick={() =>
                          setOpen(open === record.id ? null : record.id)
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 rounded text-left sm:gap-4"
                      >
                        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary sm:flex">
                          <FileText
                            className="h-[18px] w-[18px]"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium sm:text-[15px]">
                            {record.repo_name}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <time dateTime={record.created_at}>
                              {new Date(record.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </time>
                            {record.branch && (
                              <span className="inline-flex min-w-0 items-center gap-1 font-mono">
                                <GitBranch
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                <span className="max-w-[160px] truncate">
                                  {record.branch}
                                </span>
                              </span>
                            )}
                          </span>
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${open === record.id ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete changelog for ${record.repo_name}`}
                        title="Delete changelog"
                        disabled={deleting !== null}
                        onClick={() =>
                          setConfirmDelete(
                            confirmDelete === record.id ? null : record.id,
                          )
                        }
                      >
                        <Trash2
                          className="h-4 w-4 text-muted-foreground"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                    {confirmDelete === record.id && (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-destructive/[0.04] px-5 py-4">
                        <p className="text-xs text-muted-foreground">
                          Delete this changelog? This can’t be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deleting !== null}
                            onClick={() => setConfirmDelete(null)}
                          >
                            Keep it
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleting !== null}
                            onClick={() => remove(record.id)}
                          >
                            {deleting === record.id && (
                              <Loader2
                                className="h-3 w-3 animate-spin"
                                aria-hidden="true"
                              />
                            )}
                            Delete changelog
                          </Button>
                        </div>
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {open === record.id && (
                        <m.div
                          key="content"
                          id={`changelog-${record.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.1 } }}
                          className="border-t border-border p-3 sm:p-5"
                        >
                          <ChangelogOutput
                            content={record.content}
                            repoName={record.repo_name}
                            compact
                          />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      ) : null}
    </>
  );
}
