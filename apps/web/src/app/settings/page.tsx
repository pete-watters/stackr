'use client';

import { Header } from '@/components/header';
import { css } from 'styled-system/css';

export default function SettingsPage() {
  return (
    <>
      <Header />
      <main className={css({ maxW: '32rem', mx: 'auto', p: 'space.05', px: 'space.04' })}>
        <h1 className={css({ textStyle: 'heading.02', mb: 'space.05' })}>Settings</h1>

        <div
          className={css({
            p: 'space.04',
            bg: 'ink.component-bg-default',
            borderRadius: 'lg',
            border: '1px solid',
            borderColor: 'ink.border-subtle',
          })}
        >
          <h2 className={css({ textStyle: 'label.01', mb: 'space.03' })}>API Keys</h2>
          <div>
            <label
              htmlFor="etherscan-key"
              className={css({
                display: 'block',
                textStyle: 'label.02',
                color: 'ink.text-secondary',
                mb: 'space.01',
              })}
            >
              Etherscan API Key (optional)
            </label>
            <input
              id="etherscan-key"
              type="text"
              placeholder="Enter your Etherscan API key"
              className={css({
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
              })}
            />
          </div>
        </div>
      </main>
    </>
  );
}
