'use client';

interface Props {
  branch: string;
  defaultBranch: string;
  since: string;
  until: string;
  onChange: (next: { branch?: string; since?: string; until?: string }) => void;
}

export function CommitRangePicker({
  branch,
  defaultBranch,
  since,
  until,
  onChange,
}: Props) {
  const field =
    'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <label className="space-y-1.5">
        <span className="text-sm text-muted-foreground">Branch</span>
        <input
          className={field}
          value={branch}
          placeholder={defaultBranch}
          onChange={(e) => onChange({ branch: e.target.value })}
        />
      </label>

      <label className="space-y-1.5">
        <span className="text-sm text-muted-foreground">From (date)</span>
        <input
          type="date"
          className={field}
          value={since}
          onChange={(e) => onChange({ since: e.target.value })}
        />
      </label>

      <label className="space-y-1.5">
        <span className="text-sm text-muted-foreground">To (date)</span>
        <input
          type="date"
          className={field}
          value={until}
          onChange={(e) => onChange({ until: e.target.value })}
        />
      </label>
    </div>
  );
}
