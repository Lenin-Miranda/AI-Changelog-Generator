"use client";

import type { ReactNode } from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-5 sm:mb-11">
      <div className="max-w-2xl">
        <h1 className="text-balance text-[2rem] font-medium leading-tight tracking-[-0.035em] sm:text-[2.65rem]">
          {title}
        </h1>
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function Notice({
  title,
  children,
  onRetry,
}: {
  title: string;
  children?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/[0.05] p-4 text-sm"
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-destructive">{title}</p>
        {children && (
          <div className="mt-1 break-words leading-relaxed text-muted-foreground">
            {children}
          </div>
        )}
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="mt-3"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-14 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted/50 text-primary">
        <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="divide-y divide-border rounded-lg border border-border"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex items-center gap-4 p-5 sm:p-6"
        >
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-4 w-2/5 rounded" />
            <div className="skeleton h-3 w-3/5 rounded" />
          </div>
          <div className="skeleton hidden h-4 w-20 rounded sm:block" />
        </div>
      ))}
    </div>
  );
}
