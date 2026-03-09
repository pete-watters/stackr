'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Chain } from '@stackr/models';
import { ChainSchema, chainMeta, validateAddress } from '@stackr/models';
import { Button, Input } from '@stackr/ui';
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
  const [addressError, setAddressError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !address) return;

    const result = validateAddress(chain, address);
    if (!result.valid) {
      setAddressError(result.error ?? 'Invalid address');
      return;
    }

    setAddressError('');
    addWallet({ label, chain, address });
    router.push('/');
  };

  const selectStyles = css({
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
          <Input
            label="Label"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. My Bitcoin Wallet"
            required
            className="input"
          />

          <div>
            <label
              htmlFor="chain"
              className={css({
                display: 'block',
                textStyle: 'label.02',
                color: 'ink.text-secondary',
                mb: 'space.01',
              })}
            >
              Chain
            </label>
            <select
              id="chain"
              value={chain}
              onChange={e => {
                setChain(e.target.value as Chain);
                setAddressError('');
              }}
              className={selectStyles}
            >
              {chains.map(c => (
                <option key={c} value={c}>
                  {chainMeta[c].name} ({chainMeta[c].symbol})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Address"
            value={address}
            onChange={e => {
              setAddress(e.target.value);
              setAddressError('');
            }}
            placeholder="Enter wallet address"
            required
            error={addressError}
            className={css({ fontFamily: 'mono' }) + ' input'}
          />

          <Button
            type="submit"
            className="button button--primary button--md"
            style={{ marginTop: '8px' }}
          >
            Add Wallet
          </Button>
        </form>
      </main>
    </>
  );
}
