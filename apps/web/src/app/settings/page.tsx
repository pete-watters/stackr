'use client';

import { Input, Card } from '@stackr/ui';
import { useSettingsStore } from '@/lib/settings-store';
import { Header } from '@/components/header';

export default function SettingsPage() {
  const etherscanApiKey = useSettingsStore(s => s.etherscanApiKey);
  const setEtherscanApiKey = useSettingsStore(s => s.setEtherscanApiKey);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">API Keys</h2>
          <Input
            label="Etherscan API Key (optional)"
            value={etherscanApiKey}
            onChange={e => setEtherscanApiKey(e.target.value)}
            placeholder="Enter your Etherscan API key"
          />
        </Card>
      </main>
    </>
  );
}
