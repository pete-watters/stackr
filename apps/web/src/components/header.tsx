'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/" className="text-xl font-bold text-foreground">
        Stackr
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/wallet/add" className="text-sm font-semibold text-primary">
          Add Wallet
        </Link>
        <Link
          href="/holdings"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Holdings
        </Link>
        <Link
          href="/market"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Market
        </Link>
        <Link
          href="/settings"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
