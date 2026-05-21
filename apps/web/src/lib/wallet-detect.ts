export type WalletId = 'metamask' | 'phantom' | 'leather';

export const INSTALL_URLS: Record<WalletId, string> = {
  metamask: 'https://metamask.io/download',
  phantom: 'https://phantom.app/download',
  leather: 'https://leather.io/install-extension',
};

/**
 * Detect which wallet extensions have injected a provider. Pure and
 * window-shaped so it is unit-testable with plain objects, and dependency-free
 * so importing it does not pull in the wallet SDKs.
 */
export function detectInstalledWallets(w: object): Record<WalletId, boolean> {
  return {
    metamask: 'ethereum' in w,
    phantom: 'phantom' in w,
    leather: 'LeatherProvider' in w,
  };
}
