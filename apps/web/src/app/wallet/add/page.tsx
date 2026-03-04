'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Chain } from '@stackr/models';
import { ChainSchema, chainMeta } from '@stackr/models';
import { useWalletStore } from '@/lib/wallet-store';
import { Header } from '@/components/header';

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#fafafa' }}>
      <Header />
      <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add Wallet</h1>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div>
            <label
              htmlFor="label"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: '#a3a3a3',
                marginBottom: '0.375rem',
              }}
            >
              Label
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. My Bitcoin Wallet"
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #404040',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="chain"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: '#a3a3a3',
                marginBottom: '0.375rem',
              }}
            >
              Chain
            </label>
            <select
              id="chain"
              value={chain}
              onChange={e => setChain(e.target.value as Chain)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #404040',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            >
              {chains.map(c => (
                <option key={c} value={c}>
                  {chainMeta[c].name} ({chainMeta[c].symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="address"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: '#a3a3a3',
                marginBottom: '0.375rem',
              }}
            >
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter wallet address"
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #404040',
                borderRadius: '8px',
                color: '#fafafa',
                fontSize: '0.875rem',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            Add Wallet
          </button>
        </form>
      </main>
    </div>
  );
}
