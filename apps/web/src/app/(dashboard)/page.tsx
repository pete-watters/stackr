'use client';

import Link from 'next/link';
import { Button } from '@stackr/ui';
import { useWalletStore } from '@/lib/wallet-store';
import { useSettingsStore } from '@/lib/settings-store';
import { useBalances, usePrices, usePriceHistory } from '@stackr/queries';
import type { Chain } from '@stackr/models';
import { Header } from '@/components/header';
import { WalletCard } from '@/components/wallet-card';
import { PortfolioSummary } from '@/components/portfolio-summary';
import { PortfolioBreakdown } from '@/components/portfolio-breakdown';
import { css } from 'styled-system/css';

export default function DashboardPage() {
  const wallets = useWalletStore(s => s.wallets);
  const etherscanApiKey = useSettingsStore(s => s.etherscanApiKey);
  const balanceQueries = useBalances(wallets, {
    ethApiKey: etherscanApiKey || undefined,
  });

  const uniqueChains = [...new Set(wallets.map(w => w.chain))] as Chain[];
  const { data: prices } = usePrices(uniqueChains);

  // Get 7d price history for the first chain (for portfolio sparkline)
  const primaryChain = uniqueChains[0];
  const { data: priceHistory } = usePriceHistory(primaryChain ?? 'btc', 7);

  const priceMap = new Map(prices?.map(p => [p.chain, p]) ?? []);

  const totalUsd = wallets.reduce((sum, wallet, i) => {
    const balance = balanceQueries[i]?.data;
    const price = priceMap.get(wallet.chain);
    if (balance && price) {
      return sum + parseFloat(balance.balance) * price.usdPrice;
    }
    return sum;
  }, 0);

  const allLoaded = balanceQueries.every(q => !q.isLoading);

  // Compute weighted average 24h change
  const weightedChange =
    totalUsd > 0
      ? wallets.reduce((acc, wallet, i) => {
          const balance = balanceQueries[i]?.data;
          const price = priceMap.get(wallet.chain);
          if (balance && price) {
            const value = parseFloat(balance.balance) * price.usdPrice;
            return acc + (price.change24h * value) / totalUsd;
          }
          return acc;
        }, 0)
      : undefined;

  // Compute allocations for breakdown
  const allocations = uniqueChains
    .map(chain => {
      const chainWallets = wallets.map((w, i) => ({ w, i })).filter(({ w }) => w.chain === chain);
      const usdValue = chainWallets.reduce((sum, { i }) => {
        const balance = balanceQueries[i]?.data;
        const price = priceMap.get(chain);
        if (balance && price) return sum + parseFloat(balance.balance) * price.usdPrice;
        return sum;
      }, 0);
      return {
        chain,
        usdValue,
        percentage: totalUsd > 0 ? (usdValue / totalUsd) * 100 : 0,
      };
    })
    .filter(a => a.usdValue > 0);

  const sparklineValues = priceHistory?.map(p => p.price);

  return (
    <>
      <Header />
      <main className={css({ maxW: '48rem', mx: 'auto', p: 'space.05', px: 'space.04' })}>
        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 'space.05',
          })}
        >
          <h1 className={css({ textStyle: 'heading.02' })}>Portfolio</h1>
          <Button asChild className="button button--primary button--md">
            <Link href="/wallet/add">+ Add Wallet</Link>
          </Button>
        </div>

        {wallets.length === 0 ? (
          <div
            className={css({
              textAlign: 'center',
              py: 'space.09',
              px: 'space.05',
              border: '1px dashed',
              borderColor: 'ink.border-subtle',
              borderRadius: 'lg',
              color: 'ink.text-muted',
            })}
          >
            <p className={css({ textStyle: 'body.01', mb: 'space.02' })}>No wallets yet</p>
            <p className={css({ textStyle: 'body.02' })}>
              Add your first wallet to start tracking your portfolio.
            </p>
          </div>
        ) : (
          <>
            <PortfolioSummary
              totalUsd={totalUsd}
              change24h={allLoaded ? weightedChange : undefined}
              sparklineData={sparklineValues}
              isLoading={!allLoaded}
            />

            {allLoaded && allocations.length > 0 && (
              <PortfolioBreakdown allocations={allocations} />
            )}

            <div className={css({ display: 'flex', flexDirection: 'column', gap: 'space.03' })}>
              {wallets.map((wallet, i) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  balance={balanceQueries[i]?.data}
                  isLoading={balanceQueries[i]?.isLoading}
                  price={priceMap.get(wallet.chain)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
