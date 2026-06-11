import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

/**
 * A single Phantom adapter instance, shared by the Solana `WalletProvider` and
 * the Solana wallet source adapter. Both must wrap the *same* instance so the
 * adapter's `connect`/`disconnect` events — whoever triggers them — reach the
 * WalletConnectionController. Created lazily on first use, which matches the
 * previous `useMemo(() => [new PhantomWalletAdapter()])` call site and keeps the
 * constructor off the module-evaluation path.
 */
let instance: PhantomWalletAdapter | null = null;

export function getPhantomWalletAdapter(): PhantomWalletAdapter {
  instance ??= new PhantomWalletAdapter();
  return instance;
}
