import Link from 'next/link';
import { Button } from '@stackr/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo mark — four-bar chart mirroring the favicon */}
        <div className="flex items-end gap-1.5">
          <div className="w-3 h-4 rounded-sm bg-chain-eth" />
          <div className="w-3 h-6 rounded-sm bg-chain-btc" />
          <div className="w-3 h-8 rounded-sm bg-chain-stx" />
          <div className="w-3 h-5 rounded-sm bg-chain-sol" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase select-none">
            error[E0404]
          </p>
          <h1 className="font-mono text-8xl font-bold text-foreground leading-none tracking-tighter">
            404
          </h1>
          <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/">← Back to portfolio</Link>
        </Button>
      </div>
    </main>
  );
}
