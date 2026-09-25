"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, GitFork, LockKeyhole, Search } from "lucide-react";
import type { Repo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  repos: Repo[];
  selected: Repo | null;
  onSelect: (repo: Repo) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function RepoSelector({
  repos,
  selected,
  onSelect,
  disabled = false,
  loading = false,
}: Props) {
  const [query, setQuery] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  const filtered = repos.filter((repo) =>
    repo.fullName.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <details
      ref={details}
      className="repo-picker relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && details.current) {
          details.current.open = false;
          details.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary
        aria-label="Select a repository"
        aria-disabled={disabled || loading}
        onClick={(event) => {
          if (disabled || loading) event.preventDefault();
        }}
        className={cn(
          "field flex cursor-pointer items-center gap-2.5 py-3",
          (disabled || loading) && "cursor-not-allowed opacity-50",
        )}
      >
        <GitFork className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm">
          {loading
            ? "Loading repositories…"
            : (selected?.fullName ?? "Choose a repository")}
        </span>
        <ChevronDown
          className="picker-chevron h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-2 overflow-hidden rounded-md border border-input bg-background">
        <div className="relative border-b border-border p-2">
          <Search
            className="pointer-events-none absolute left-5 top-5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            aria-label="Filter repositories"
            className="field border-transparent pl-9 focus:ring-0"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search repositories…"
          />
        </div>
        <div className="max-h-52 overflow-y-auto p-1">
          {filtered.map((repo) => (
            <button
              key={repo.id}
              type="button"
              aria-pressed={selected?.id === repo.id}
              disabled={disabled}
              className={cn(
                "flex min-h-11 w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted",
                selected?.id === repo.id
                  ? "bg-muted text-primary"
                  : "text-muted-foreground",
              )}
              onClick={() => {
                onSelect(repo);
                setQuery("");
                if (details.current) {
                  details.current.open = false;
                  details.current.querySelector("summary")?.focus();
                }
              }}
            >
              <span className="min-w-0 flex-1 truncate">{repo.fullName}</span>
              {repo.private && (
                <LockKeyhole className="h-3 w-3" aria-label="Private" />
              )}
              {selected?.id === repo.id && (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-5 text-sm text-muted-foreground">
              {query
                ? "No matches. Try another name."
                : "No repositories available."}
            </p>
          )}
        </div>
      </div>
    </details>
  );
}
