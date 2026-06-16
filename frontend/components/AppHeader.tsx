'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Repositories' },
  { href: '/generate', label: 'Generate' },
  { href: '/history', label: 'History' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            <span className="text-primary">⌁</span> Changelog
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  pathname === l.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user?.name && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.name}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
