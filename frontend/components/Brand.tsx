import Link from "next/link";
import { AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Changelog home"
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 rounded-sm text-xl font-semibold tracking-tight",
        className,
      )}
    >
      <AlignLeft
        className="h-7 w-7 text-primary"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span>
        changelog<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
