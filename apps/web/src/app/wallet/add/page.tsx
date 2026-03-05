'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Chain } from '@stackr/models';
import { ChainSchema, chainMeta } from '@stackr/models';
import { useWalletStore } from '@/lib/wallet-store';
import { Header } from '@/components/header';
import { css } from 'styled-system/css';

const chains = ChainSchema.options;

export default function AddWalletPage() {
  const router = useRouter();
  const addWallet = useWalletStore(s => s.addWallet);
  const [label, setLabel] = useState('');
  const [chain, setChain] = useState<Chain>('btc');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !address) return;

    addWallet({ label, chain, address });
    router.push('/');
  };

  const labelStyles = css({
    display: 'block',
    textStyle: 'label.02',
    color: 'ink.text-secondary',
    mb: 'space.01',
  });

  const inputStyles = css({
    w: '100%',
    px: 'space.03',
    py: 'space.02',
    bg: 'ink.bg-primary',
    border: '1px solid',
    borderColor: 'ink.border-default',
    borderRadius: 'md',
    color: 'ink.text-primary',
    textStyle: 'body.02',
    outline: 'none',
    _focus: { borderColor: 'accent.solid-default' },
    _placeholder: { color: 'ink.text-muted' },
  });

  return (
    <>
      <Header />
      <main className={css({ maxW: '32rem', mx: 'auto', p: 'space.05', px: 'space.04' })}>
        <h1 className={css({ textStyle: 'heading.02', mb: 'space.05' })}>Add Wallet</h1>

        <form
          onSubmit={handleSubmit}
          className={css({ display: 'flex', flexDirection: 'column', gap: 'space.04' })}
        >
          <div>
            <label htmlFor="label" className={labelStyles}>
              Label
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. My Bitcoin Wallet"
              required
              className={inputStyles}
            />
          </div>

          <div>
            <label htmlFor="chain" className={labelStyles}>
              Chain
            </label>
            <select
              id="chain"
              value={chain}
              onChange={e => setChain(e.target.value as Chain)}
              className={inputStyles}
            >
              {chains.map(c => (
                <option key={c} value={c}>
                  {chainMeta[c].name} ({chainMeta[c].symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="address" className={labelStyles}>
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter wallet address"
              required
              className={css({
                w: '100%',
                px: 'space.03',
                py: 'space.02',
                bg: 'ink.bg-primary',
                border: '1px solid',
                borderColor: 'ink.border-default',
                borderRadius: 'md',
                color: 'ink.text-primary',
                textStyle: 'mono.03',
                outline: 'none',
                _focus: { borderColor: 'accent.solid-default' },
                _placeholder: { color: 'ink.text-muted' },
              })}
            />
          </div>

          <button
            type="submit"
            className={css({
              px: 'space.05',
              py: 'space.03',
              bg: 'accent.solid-default',
              color: 'white',
              border: 'none',
              borderRadius: 'md',
              textStyle: 'label.01',
              cursor: 'pointer',
              mt: 'space.02',
              _hover: { bg: 'accent.solid-hover' },
            })}
          >
            Add Wallet
          </button>
        </form>
      </main>
    </>
  );
}
