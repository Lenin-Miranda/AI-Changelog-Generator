"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  FileOutput,
  GitBranch,
  Github,
  SlidersHorizontal,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { HeroDemo } from "@/components/HeroDemo";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: GitBranch,
    title: "Pick your repository.",
    body: "Connect GitHub and choose the project you’re ready to talk about.",
  },
  {
    icon: SlidersHorizontal,
    title: "Find the right words.",
    body: "Set a branch, a date range, and a tone. Turn the changes into a readable draft.",
  },
  {
    icon: FileOutput,
    title: "Share what changed.",
    body: "Copy for Markdown, Notion, or Slack. Download a file and make it yours.",
  },
];

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const connect = async () => {
    setConnecting(true);
    setError(false);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch {
      setError(true);
      setConnecting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
      <header className="flex h-24 items-center justify-between gap-5">
        <Brand />
        <nav
          aria-label="Website navigation"
          className="flex items-center gap-7"
        >
          <a href="#how-it-works" className="text-link hidden sm:inline-flex">
            How it works
          </a>
          <Button
            variant="ghost"
            size="sm"
            disabled={connecting || status === "loading"}
            onClick={connect}
          >
            Connect GitHub
            <ArrowUpRightIcon />
          </Button>
        </nav>
      </header>
      <main id="main-content">
        <section
          aria-label="Create your next changelog"
          className="grid items-center gap-10 pb-20 pt-9 sm:gap-14 sm:pb-28 sm:pt-16 lg:min-h-[680px] lg:grid-cols-[1.08fr_1fr] lg:gap-12 lg:pb-24 lg:pt-10"
        >
          <div className="hero-arrival">
            <h1 className="hero-title font-medium">
              <span>You ship the code.</span>
              <span>We’ll find</span>
              <span className="text-primary">the words.</span>
            </h1>
            <p className="mt-7 max-w-[440px] text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Turn your GitHub commits into clear release notes. Choose a range,
              find your tone, and share what changed.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-5">
              <Button
                size="lg"
                disabled={connecting || status === "loading"}
                onClick={connect}
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                {connecting ? "Connecting…" : "Connect GitHub"}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
              <a href="#example" className="text-link">
                See an example
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                Couldn’t open GitHub sign-in. Please try again.
              </p>
            ) : (
              <p className="mt-5 text-xs text-muted-foreground">
                Your commits in. Your story out.
              </p>
            )}
          </div>
          <HeroDemo />
        </section>
        <section
          id="how-it-works"
          aria-labelledby="workflow-heading"
          className="border-t border-border py-16 sm:py-24"
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2
              id="workflow-heading"
              className="max-w-xl text-balance text-3xl font-medium leading-tight tracking-[-0.035em] sm:text-[2.6rem]"
            >
              From commit history
              <br className="hidden sm:block" /> to a clear story.
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Less time piecing together release notes.
              <br />
              More time building what comes next.
            </p>
          </div>
          <ol className="mt-12 grid gap-9 md:grid-cols-3 md:gap-0">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className="border-t border-border pt-6 md:border-l md:border-t-0 md:px-8 md:pt-0 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
              >
                <div className="mb-6 flex items-center gap-3 text-primary">
                  <span className="font-mono text-xs">0{i + 1}</span>
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-medium tracking-tight">{title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-9">
            <p className="max-w-lg text-xl font-medium tracking-tight sm:text-2xl">
              Your next release deserves a good changelog.
            </p>
            <Button
              size="lg"
              onClick={connect}
              disabled={connecting || status === "loading"}
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              {connecting ? "Connecting…" : "Start with GitHub"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border py-7 text-xs text-muted-foreground">
        <span>Changelog — Less writing. More shipping.</span>
        <a href="#main-content" className="text-link text-xs">
          Back to top
          <ArrowDown className="h-3 w-3 rotate-180" aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight className="h-3.5 w-3.5 -rotate-45" aria-hidden="true" />;
}
