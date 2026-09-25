"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import {
  ArrowUpRight,
  Check,
  GitBranch,
  GitCommitHorizontal,
} from "lucide-react";
import { SegmentedControl } from "@/components/SegmentedControl";

const commits = [
  { hash: "9f3c2e1", message: "feat: add recurring billing", type: "feature" },
  { hash: "a7b1d90", message: "fix: onboarding redirect loop", type: "fix" },
  { hash: "c4e8f2a", message: "feat: add workspace search", type: "feature" },
];

export function HeroDemo() {
  const [view, setView] = useState<"release" | "commits">("release");
  return (
    <div id="example" className="hero-scene hero-arrival-late scroll-mt-8">
      <div className="hero-commits" aria-hidden="true">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <GitCommitHorizontal className="h-4 w-4" />3 commits selected
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <GitBranch className="h-3 w-3" />
            main
          </span>
        </div>
      </div>
      <div className="hero-document">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
          <span className="font-mono text-xs text-muted-foreground">
            studio / release-notes
          </span>
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Example
          </span>
        </div>
        <div className="px-5 pb-6 pt-5 sm:px-7">
          <div className="mb-7 flex items-center justify-between gap-3">
            <SegmentedControl
              label="Example view"
              value={view}
              onChange={setView}
              options={[
                { value: "release", label: "Release notes" },
                { value: "commits", label: "Commits" },
              ]}
            />
            <ArrowUpRight
              className="hidden h-4 w-4 text-muted-foreground sm:block"
              aria-hidden="true"
            />
          </div>
          <div className="min-h-[295px] sm:min-h-[315px]">
            <AnimatePresence mode="wait" initial={false}>
              {view === "release" ? (
                <m.div
                  key="release"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="max-w-sm text-[1.65rem] font-medium leading-tight tracking-[-0.03em] sm:text-[1.9rem]">
                    A better way to
                    <br />
                    ship updates.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    A few thoughtful changes to make your everyday work a little
                    easier.
                  </p>
                  <div className="mt-7 space-y-5">
                    <section>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        New features
                      </h3>
                      <p className="pl-3.5 text-sm leading-relaxed text-muted-foreground">
                        Set up recurring billing and find what you need with
                        workspace search.
                      </p>
                    </section>
                    <section>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Bug fixes
                      </h3>
                      <p className="pl-3.5 text-sm leading-relaxed text-muted-foreground">
                        New teammates can finish onboarding without being sent
                        back to sign in.
                      </p>
                    </section>
                  </div>
                </m.div>
              ) : (
                <m.div
                  key="commits"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-xl font-medium tracking-tight">
                    Every update starts here.
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The same three commits, before the rewrite.
                  </p>
                  <ul className="mt-7 space-y-6">
                    {commits.map((commit) => (
                      <li
                        key={commit.hash}
                        className="commit-arrival flex gap-3"
                      >
                        <GitCommitHorizontal
                          className="mt-1 h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="break-words font-mono text-xs leading-relaxed">
                            {commit.message}
                          </p>
                          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                            {commit.hash} · {commit.type}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-muted-foreground sm:px-7">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Same commits. Clearer story.
          </span>
          <span className="font-mono">.md</span>
        </div>
      </div>
    </div>
  );
}
