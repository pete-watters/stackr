import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore } from './wallet-store';

describe('wallet store', () => {
  beforeEach(() => {
    useWalletStore.setState({ wallets: [], connectedAddresses: {} });
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

describe('connectedAddresses slice', () => {
  beforeEach(() => {
    useWalletStore.setState({ wallets: [], connectedAddresses: {} });
  });

  it('initialises with empty connectedAddresses', () => {
    expect(useWalletStore.getState().connectedAddresses).toEqual({});
  });

  it('sets connected addresses for a chain', () => {
    const addr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    useWalletStore.getState().setConnectedAddresses('eth', [addr]);

    expect(useWalletStore.getState().connectedAddresses.eth).toEqual([addr]);
  });

  it('replaces connected addresses when called again', () => {
    const addr1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const addr2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    useWalletStore.getState().setConnectedAddresses('eth', [addr1]);
    useWalletStore.getState().setConnectedAddresses('eth', [addr2]);

    expect(useWalletStore.getState().connectedAddresses.eth).toEqual([addr2]);
  });

  it('clears connected addresses for a chain', () => {
    const addr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    useWalletStore.getState().setConnectedAddresses('eth', [addr]);
    useWalletStore.getState().clearConnectedAddresses('eth');

    expect(useWalletStore.getState().connectedAddresses.eth).toBeUndefined();
  });

  it('does not affect other chains when clearing', () => {
    useWalletStore.getState().setConnectedAddresses('eth', ['0xabc']);
    useWalletStore.getState().setConnectedAddresses('sol', ['SolAddr1']);
    useWalletStore.getState().clearConnectedAddresses('eth');

    expect(useWalletStore.getState().connectedAddresses.eth).toBeUndefined();
    expect(useWalletStore.getState().connectedAddresses.sol).toEqual(['SolAddr1']);
  });

  it('supports multiple chains independently', () => {
    useWalletStore.getState().setConnectedAddresses('eth', ['0xeth']);
    useWalletStore.getState().setConnectedAddresses('sol', ['SolAddr']);

    const { connectedAddresses } = useWalletStore.getState();
    expect(connectedAddresses.eth).toEqual(['0xeth']);
    expect(connectedAddresses.sol).toEqual(['SolAddr']);
  });
});
