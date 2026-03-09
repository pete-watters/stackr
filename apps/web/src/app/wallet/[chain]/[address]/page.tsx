'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChainSchema, chainMeta } from '@stackr/models';
import type { Chain } from '@stackr/models';
import { useBalance, usePrices, useTransactions } from '@stackr/queries';
import { formatUsd } from '@stackr/services';
import {
  Button,
  Input,
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
import { css } from 'styled-system/css';

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
  const {
    data: balance,
    isLoading,
    error,
  } = useBalance(chain, address, {
    ethApiKey: etherscanApiKey || undefined,
  });
  const { data: prices } = usePrices([chain]);
  const price = prices?.[0];
  const usdValue = balance && price ? parseFloat(balance.balance) * price.usdPrice : undefined;
  const { data: transactions, isLoading: txLoading } = useTransactions(chain, address);

  const [editLabel, setEditLabel] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!chainResult.success) {
    return (
      <>
        <Header />
        <main
          className={css({
            maxW: '48rem',
            mx: 'auto',
            p: 'space.05',
            px: 'space.04',
            textAlign: 'center',
          })}
        >
          <p className={css({ color: 'error.text' })}>Invalid chain: {chainParam}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={css({ maxW: '48rem', mx: 'auto', p: 'space.05', px: 'space.04' })}>
        <Link href="/" className={css({ textStyle: 'label.01', color: 'accent.text' })}>
          &larr; Back to Portfolio
        </Link>

        <div
          className={css({
            mt: 'space.05',
            display: 'flex',
            alignItems: 'center',
            gap: 'space.03',
          })}
        >
          <div>
            <h1 className={css({ textStyle: 'heading.02' })}>{wallet?.label ?? 'Wallet'}</h1>
            <div
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: 'space.02',
                mt: 'space.01',
              })}
            >
              <span className={css({ textStyle: 'body.02', color: 'ink.text-secondary' })}>
                {meta.name}
              </span>
              <AddressDisplayer
                address={address}
                className={css({ textStyle: 'mono.03', color: 'ink.text-secondary' })}
              />
              <CopyButton
                text={address}
                className={css({
                  textStyle: 'caption.01',
                  color: 'accent.text',
                  bg: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                })}
              />
            </div>
          </div>
          {wallet && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="button button--ghost button--sm"
                  onClick={() => setEditLabel(wallet.label)}
                >
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent
                className={
                  css({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bg: 'ink.bg-secondary',
                    borderRadius: 'lg',
                    border: '1px solid',
                    borderColor: 'ink.border-subtle',
                    p: 'space.05',
                    w: '90vw',
                    maxW: '24rem',
                    zIndex: 'modal',
                  }) + ' dialog-content'
                }
              >
                <DialogTitle
                  className={css({ textStyle: 'heading.03', mb: 'space.03' }) + ' dialog-title'}
                >
                  Edit Wallet Label
                </DialogTitle>
                <DialogDescription
                  className={
                    css({ textStyle: 'body.02', color: 'ink.text-secondary', mb: 'space.04' }) +
                    ' dialog-description'
                  }
                >
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
                  className={css({ display: 'flex', flexDirection: 'column', gap: 'space.03' })}
                >
                  <Input
                    label="Label"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    required
                    className="input"
                  />
                  <div
                    className={css({
                      display: 'flex',
                      gap: 'space.02',
                      justifyContent: 'flex-end',
                    })}
                  >
                    <DialogClose asChild>
                      <Button
                        variant="ghost"
                        type="button"
                        className="button button--ghost button--md"
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" className="button button--primary button--md">
                      Save
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div
          className={css({
            mt: 'space.05',
            p: 'space.05',
            bg: 'ink.component-bg-default',
            borderRadius: 'lg',
            border: '1px solid',
            borderColor: 'ink.border-subtle',
          })}
        >
          <div
            className={css({ textStyle: 'label.02', color: 'ink.text-secondary', mb: 'space.02' })}
          >
            Balance
          </div>
          {isLoading ? (
            <Skeleton width={160} height="2rem" className="skeleton" />
          ) : error ? (
            <div className={css({ textStyle: 'body.01', color: 'error.text' })}>
              Failed to load balance
            </div>
          ) : balance ? (
            <>
              <div className={css({ textStyle: 'mono.01' })}>
                {balance.balance} {meta.symbol}
              </div>
              {usdValue !== undefined && (
                <div
                  className={css({
                    textStyle: 'body.02',
                    color: 'ink.text-secondary',
                    mt: 'space.01',
                  })}
                >
                  {formatUsd(usdValue)}
                </div>
              )}
            </>
          ) : null}
        </div>

        <div
          className={css({
            mt: 'space.05',
            bg: 'ink.component-bg-default',
            borderRadius: 'lg',
            border: '1px solid',
            borderColor: 'ink.border-subtle',
            overflow: 'hidden',
          })}
        >
          <div
            className={css({
              textStyle: 'label.02',
              color: 'ink.text-secondary',
              p: 'space.03',
              borderBottom: '1px solid',
              borderColor: 'ink.border-subtle',
            })}
          >
            Recent Transactions
          </div>
          <div className={css({ p: 'space.02' })}>
            <TransactionList
              transactions={transactions ?? []}
              chain={chain}
              isLoading={txLoading}
            />
          </div>
        </div>

        {wallet && (
          <Button
            variant="danger"
            className="button button--danger button--md"
            onClick={() => {
              removeWallet(wallet.id);
              router.push('/');
            }}
            style={{ marginTop: '32px' }}
          >
            Remove Wallet
          </Button>
        )}
      </main>
    </>
  );
}
