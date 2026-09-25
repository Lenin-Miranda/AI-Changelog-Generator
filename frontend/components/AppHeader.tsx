"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { m } from "motion/react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Repositories" },
  { href: "/generate", label: "Generate" },
  { href: "/history", label: "History" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Your workspace";

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_auto] items-center gap-x-6 px-5 pt-5 sm:px-8 md:grid-cols-[1fr_auto_1fr] md:py-0">
        <Brand href="/dashboard" />
        <nav
          aria-label="Main navigation"
          className="col-span-2 row-start-2 mt-3 flex gap-6 md:col-span-1 md:col-start-2 md:row-start-1 md:mt-0"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 items-center whitespace-nowrap text-sm font-medium transition-colors md:min-h-[76px]",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
              {pathname === link.href && (
                <m.span
                  layoutId="nav-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                  transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 md:col-start-3">
          <span className="hidden max-w-[150px] truncate text-sm text-muted-foreground lg:block">
            {name}
          </span>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium text-primary"
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </header>
  );
}
