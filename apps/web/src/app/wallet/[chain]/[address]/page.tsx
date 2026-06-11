'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChainSchema, chainMeta } from '@stackr/models';
import type { Chain } from '@stackr/models';
import { useBalance, usePrices, useTransactions } from '@stackr/queries';
import { track } from '@stackr/analytics';
import { formatFiat } from '@stackr/services';
import {
  Button,
  Input,
  Card,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  AddressDisplayer,
  CopyButton,
  Skeleton,
} from '@stackr/ui';
import { useWalletStore } from '@/lib/wallet-store';
import { useSettingsStore } from '@/lib/settings-store';
import { Header } from '@/components/header';
import { TransactionList } from '@/components/transaction-list';

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}) {
  const { chain: chainParam, address } = use(params);
  const router = useRouter();
  const chainResult = ChainSchema.safeParse(chainParam);
  const chain: Chain = chainResult.success ? chainResult.data : 'btc';
  const meta = chainMeta[chain];

  const wallet = useWalletStore(s =>
    s.wallets.find(w => w.chain === chain && w.address === address),
  );
  const removeWallet = useWalletStore(s => s.removeWallet);
  const updateLabel = useWalletStore(s => s.updateLabel);
  const etherscanApiKey = useSettingsStore(s => s.etherscanApiKey);
  const currency = useSettingsStore(s => s.currency);
  const {
    data: balance,
    isLoading,
    error,
  } = useBalance(chain, address, {
    ethApiKey: etherscanApiKey || undefined,
  });
  const { data: prices } = usePrices([chain], currency);
  const price = prices?.[0];
  const fiatValue = balance && price ? parseFloat(balance.balance) * price.fiatPrice : undefined;
  const { data: transactions, isLoading: txLoading } = useTransactions(chain, address);

  const [editLabel, setEditLabel] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Coarse, PII-free signal: which chain's detail view was opened — never the
  // address being viewed.
  useEffect(() => {
    if (chainResult.success) track('chain_viewed', { chain });
  }, [chainResult.success, chain]);

  if (!chainResult.success) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-6 text-center">
          <p className="text-destructive">Invalid chain: {chainParam}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/" className="text-sm font-semibold text-primary">
          &larr; Back to Portfolio
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">{wallet?.label ?? 'Wallet'}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{meta.name}</span>
              <AddressDisplayer address={address} className="text-xs text-muted-foreground" />
              <CopyButton text={address} />
            </div>
          </div>
          {wallet && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setEditLabel(wallet.label)}>
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Edit Wallet Label</DialogTitle>
                <DialogDescription className="mt-2">
                  Change the display name for this wallet.
                </DialogDescription>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (editLabel.trim()) {
                      updateLabel(wallet.id, editLabel.trim());
                      setDialogOpen(false);
                    }
                  }}
                  className="mt-4 flex flex-col gap-3"
                >
                  <Input
                    label="Label"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="ghost" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="mt-6 p-6">
          <div className="text-sm text-muted-foreground mb-2">Balance</div>
          {isLoading ? (
            <Skeleton width={160} height="2rem" />
          ) : error ? (
            <div className="text-base text-destructive">Failed to load balance</div>
          ) : balance ? (
            <>
              <div className="text-2xl font-mono font-bold">
                {balance.balance} {meta.symbol}
              </div>
              {fiatValue !== undefined && (
                <div className="text-sm text-muted-foreground mt-1">
                  {formatFiat(fiatValue, currency)}
                </div>
              )}
            </>
          ) : null}
        </Card>

        <Card className="mt-6 overflow-hidden">
          <div className="text-sm text-muted-foreground p-4 border-b">Recent Transactions</div>
          <div className="p-2">
            <TransactionList
              transactions={transactions ?? []}
              chain={chain}
              isLoading={txLoading}
            />
          </div>
        </Card>

        {wallet && (
          <Button
            variant="danger"
            onClick={() => {
              removeWallet(wallet.id);
              router.push('/');
            }}
            className="mt-8"
          >
            Remove Wallet
          </Button>
        )}
      </main>
    </>
  );
}
