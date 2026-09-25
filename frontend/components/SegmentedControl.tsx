"use client";

import { useId } from "react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-md bg-background p-1 ring-1 ring-border"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative flex min-h-9 flex-1 items-center justify-center rounded px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            value === option.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === option.value && (
            <m.span
              layoutId={id}
              className="absolute inset-0 rounded bg-muted"
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            />
          )}
          <span className="relative whitespace-nowrap">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
