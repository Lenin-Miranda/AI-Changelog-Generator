import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/Brand";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-12"
    >
      <Brand />
      <p className="mt-14 font-mono text-sm text-primary">404</p>
      <h1 className="mt-4 text-4xl font-medium tracking-tight">
        This page didn’t make the release.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground">
        The link may have changed. Head back home and pick up where you left
        off.
      </p>
      <Link href="/" className="text-link mt-8 w-fit text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Changelog
      </Link>
    </main>
  );
}
