"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { m } from "motion/react";
import { AppHeader } from "@/components/AppHeader";
import { Brand } from "@/components/Brand";
import { ListSkeleton } from "@/components/WorkspaceUI";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main
        id="main-content"
        className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8"
      >
        <Brand />
        <div className="mb-8 mt-16">
          <p className="text-muted-foreground" role="status">
            Opening your workspace…
          </p>
        </div>
        <ListSkeleton />
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <m.main
        key={pathname}
        id="main-content"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-9 sm:px-8 sm:py-12"
      >
        {children}
      </m.main>
      <footer className="mx-auto flex w-full max-w-[1280px] flex-wrap justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:px-8">
        <span>Less writing. More shipping.</span>
        <span>Made from your commits. Shaped by you.</span>
      </footer>
    </div>
  );
}
