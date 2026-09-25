"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/Markdown";
import { SegmentedControl } from "@/components/SegmentedControl";
import { EmptyState } from "@/components/WorkspaceUI";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  repoName?: string;
  streaming?: boolean;
  compact?: boolean;
  incomplete?: boolean;
}

function toSlack(md: string): string {
  return md
    .replace(/^#{1,6}\s*(.*)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^[-*]\s/gm, "• ");
}

export function ChangelogOutput({
  content,
  repoName,
  streaming = false,
  compact = false,
  incomplete = false,
}: Props) {
  const [view, setView] = useState<"preview" | "markdown">("preview");
  const [format, setFormat] = useState("markdown");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => {
    setCopied(false);
    setCopyError("");
  }, [content]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        format === "slack" ? toSlack(content) : content,
      );
      setCopyError("");
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(
        "Clipboard access was blocked. You can select the Markdown or download the file instead.",
      );
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${repoName?.replace(/[^a-zA-Z0-9._-]/g, "-") ?? "changelog"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section
      aria-label="Changelog output"
      className={cn(
        "min-w-0 overflow-hidden",
        compact
          ? "bg-transparent"
          : "rounded-lg border border-border bg-card lg:sticky lg:top-6",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText
            className="h-4 w-4 text-primary"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          Your release notes
        </div>
        <span
          role="status"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          {streaming ? (
            <>
              <Loader2
                className="h-3 w-3 animate-spin text-primary"
                aria-hidden="true"
              />
              Writing your draft…
            </>
          ) : content ? (
            incomplete ? "Incomplete draft" : "Ready to review"
          ) : (
            "Your next release starts here"
          )}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <SegmentedControl
          label="Output view"
          value={view}
          onChange={setView}
          options={[
            { value: "preview", label: "Preview" },
            { value: "markdown", label: "Markdown" },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Copy format"
            className="min-h-9 max-w-[130px] rounded-md border border-border bg-background px-2 text-base text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-xs"
            value={format}
            onChange={(event) => {
              setFormat(event.target.value);
              setCopied(false);
            }}
            disabled={!content || streaming}
          >
            <option value="markdown">Markdown</option>
            <option value="notion">Notion</option>
            <option value="slack">Slack</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            aria-label={copied ? "Copied to clipboard" : `Copy for ${format}`}
            title={copied ? "Copied" : `Copy for ${format}`}
            disabled={!content || streaming}
            onClick={copy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Download Markdown"
            title="Download .md"
            disabled={!content || streaming}
            onClick={download}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <span className="sr-only" role="status">
        {copied ? "Copied to clipboard." : ""}
      </span>
      {copyError && (
        <p role="alert" className="px-5 pt-4 text-sm text-destructive sm:px-6">
          {copyError}
        </p>
      )}
      <div
        className={cn("px-5 py-7 sm:px-8 sm:py-9", !compact && "min-h-[440px]")}
      >
        {content ? (
          <>
            {repoName && (
              <p className="mb-7 break-words font-mono text-xs text-muted-foreground">
                {repoName}
              </p>
            )}
            {view === "preview" ? (
              <Markdown content={content} />
            ) : (
              <pre
                tabIndex={0}
                aria-label="Raw Markdown"
                className="whitespace-pre-wrap break-words font-mono text-xs leading-7 text-muted-foreground"
              >
                {content}
              </pre>
            )}
            {streaming && <span className="stream-caret" aria-hidden="true" />}
          </>
        ) : streaming ? (
          <div role="status" className="space-y-4 py-8">
            <p className="mb-7 text-sm text-muted-foreground">
              Finding the story in your commits…
            </p>
            <div className="skeleton h-6 w-3/5 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton !mt-9 h-5 w-2/5 rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="A blank page, for now."
            description="Choose a repository and load its commits. Your release notes will take shape here as they’re written."
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3.5 text-xs text-muted-foreground sm:px-6">
        <span>
          {content
            ? "Review the draft before sharing."
            : "Features, fixes, and improvements. In your voice."}
        </span>
        <span className="font-mono">Markdown</span>
      </div>
    </section>
  );
}
