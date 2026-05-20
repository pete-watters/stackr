'use client';

import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@stackr/ui';
import { ChainStatusIndicators } from '@/components/chain-status-indicators';
import { WalletConnectModal } from '@/components/wallet-connect-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSettingsStore } from '@/lib/settings-store';

export function Header() {
  const hideBalance = useSettingsStore(s => s.hideBalance);
  const toggleHideBalance = useSettingsStore(s => s.toggleHideBalance);

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
          href="/defi"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          DeFi
        </Link>
        <Link
          href="/settings"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
        <ChainStatusIndicators />
        <WalletConnectModal />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHideBalance}
          aria-label={hideBalance ? 'Show balances' : 'Hide balances'}
        >
          {hideBalance ? (
            <EyeOff className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Eye className="h-[1.2rem] w-[1.2rem]" />
          )}
        </Button>
        <ThemeToggle />
      </nav>
    </header>
  );
}
