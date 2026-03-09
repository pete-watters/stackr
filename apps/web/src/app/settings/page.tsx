'use client';

import { Input } from '@stackr/ui';
import { useSettingsStore } from '@/lib/settings-store';
import { Header } from '@/components/header';
import { css } from 'styled-system/css';

export default function SettingsPage() {
  const etherscanApiKey = useSettingsStore(s => s.etherscanApiKey);
  const setEtherscanApiKey = useSettingsStore(s => s.setEtherscanApiKey);

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
          <Input
            label="Etherscan API Key (optional)"
            value={etherscanApiKey}
            onChange={e => setEtherscanApiKey(e.target.value)}
            placeholder="Enter your Etherscan API key"
            className="input"
          />
        </div>
      </main>
    </>
  );
}
