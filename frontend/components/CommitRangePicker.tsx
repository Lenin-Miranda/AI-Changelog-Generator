"use client";

import { GitBranch } from "lucide-react";

interface Props {
  branch: string;
  defaultBranch: string;
  since: string;
  until: string;
  onChange: (next: { branch?: string; since?: string; until?: string }) => void;
  disabled?: boolean;
}

export function CommitRangePicker({
  branch,
  defaultBranch,
  since,
  until,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="field-label">Branch</span>
        <span className="relative block">
          <GitBranch
            className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            className="field pl-10 font-mono"
            value={branch}
            placeholder={defaultBranch}
            disabled={disabled}
            onChange={(event) => onChange({ branch: event.target.value })}
          />
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0">
          <span className="field-label">From</span>
          <input
            type="date"
            className="field pr-2"
            value={since}
            max={until || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ since: event.target.value })}
          />
        </label>
        <label className="min-w-0">
          <span className="field-label">To</span>
          <input
            type="date"
            className="field pr-2"
            value={until}
            min={since || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ until: event.target.value })}
          />
        </label>
      </div>
      <p className="!mt-2 text-xs leading-relaxed text-muted-foreground">
        Dates are optional and use UTC. Leave them open for the latest commits.
      </p>
    </div>
  );
}
