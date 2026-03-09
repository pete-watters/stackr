'use client';

import Link from 'next/link';
import { css } from 'styled-system/css';

export function Header() {
  return (
    <header
      className={css({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 'space.04',
        py: 'space.03',
        borderBottom: '1px solid',
        borderColor: 'ink.border-subtle',
      })}
    >
      <Link href="/" className={css({ textStyle: 'heading.03', color: 'ink.text-primary' })}>
        Stackr
      </Link>
      <nav className={css({ display: 'flex', gap: 'space.04' })}>
        <Link href="/wallet/add" className={css({ textStyle: 'label.01', color: 'accent.text' })}>
          Add Wallet
        </Link>
        <Link
          href="/market"
          className={css({ textStyle: 'label.01', color: 'ink.text-secondary' })}
        >
          Market
        </Link>
        <Link
          href="/settings"
          className={css({ textStyle: 'label.01', color: 'ink.text-secondary' })}
        >
          Settings
        </Link>
      </nav>
    </header>
  );
}
