'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #404040',
      }}
    >
      <Link
        href="/"
        style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fafafa', textDecoration: 'none' }}
      >
        Stackr
      </Link>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link
          href="/wallet/add"
          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          Add Wallet
        </Link>
        <Link
          href="/settings"
          style={{ color: '#a3a3a3', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          Settings
        </Link>
      </nav>
    </header>
  );
}
