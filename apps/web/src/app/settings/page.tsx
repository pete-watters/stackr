'use client';

import { Header } from '@/components/header';

export default function SettingsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#fafafa' }}>
      <Header />
      <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h1>

        <div
          style={{
            padding: '1rem',
            backgroundColor: '#2B2B2B',
            borderRadius: '12px',
            border: '1px solid #404040',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>API Keys</h2>
          <div>
            <label
              htmlFor="etherscan-key"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: '#a3a3a3',
                marginBottom: '0.375rem',
              }}
            >
              Etherscan API Key (optional)
            </label>
            <input
              id="etherscan-key"
              type="text"
              placeholder="Enter your Etherscan API key"
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
        </div>
      </main>
    </div>
  );
}
