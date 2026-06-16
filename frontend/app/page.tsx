'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Github, GitBranch, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        AI-powered release notes
      </div>

      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Turn your commits into a{' '}
        <span className="text-primary">professional changelog</span>
      </h1>

      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        Connect GitHub, pick a repo and a range of commits, and let AI write
        clean, grouped release notes — ready for Markdown, Notion, or Slack.
      </p>

      <Button
        size="lg"
        className="mt-8"
        disabled={status === 'loading'}
        onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
      >
        <Github className="h-5 w-5" />
        {session ? 'Go to dashboard' : 'Connect GitHub'}
      </Button>

      <div className="mt-16 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
        {[
          { icon: GitBranch, title: 'Any repo, any range', body: 'Filter commits by branch and date.' },
          { icon: Sparkles, title: 'Grouped by AI', body: 'Features, fixes, and breaking changes.' },
          { icon: Zap, title: 'Streamed live', body: 'Watch the changelog write itself.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
