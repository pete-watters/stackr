import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore } from './wallet-store';

describe('wallet store', () => {
  beforeEach(() => {
    useWalletStore.setState({ wallets: [] });
  });

  it('adds a wallet', () => {
    useWalletStore.getState().addWallet({
      label: 'Test Wallet',
      chain: 'btc',
      address: 'bc1qtest123',
    });

    const wallets = useWalletStore.getState().wallets;
    expect(wallets).toHaveLength(1);
    expect(wallets[0].label).toBe('Test Wallet');
    expect(wallets[0].chain).toBe('btc');
    expect(wallets[0].address).toBe('bc1qtest123');
    expect(wallets[0].id).toBeDefined();
    expect(wallets[0].createdAt).toBeDefined();
  });

  it('removes a wallet', () => {
    useWalletStore.getState().addWallet({
      label: 'Test',
      chain: 'eth',
      address: '0xtest',
    });

    const id = useWalletStore.getState().wallets[0].id;
    useWalletStore.getState().removeWallet(id);
    expect(useWalletStore.getState().wallets).toHaveLength(0);
  });

  it('updates a wallet label', () => {
    useWalletStore.getState().addWallet({
      label: 'Old Label',
      chain: 'sol',
      address: 'SolTest123',
    });

    const id = useWalletStore.getState().wallets[0].id;
    useWalletStore.getState().updateLabel(id, 'New Label');
    expect(useWalletStore.getState().wallets[0].label).toBe('New Label');
  });
});
