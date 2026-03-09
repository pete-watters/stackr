'use client';

import Link from 'next/link';
import type { Currency } from '@stackr/models';
import { currencyMeta } from '@stackr/models';
import { formatFiat, formatChange } from '@stackr/services';
import { useStockQuotes } from '@stackr/queries';
import { Button, Card, Badge } from '@stackr/ui';
import { useHoldingsStore } from '@/lib/holdings-store';
import { useSettingsStore } from '@/lib/settings-store';
import { Header } from '@/components/header';

export default function HoldingsPage() {
  const holdings = useHoldingsStore(s => s.holdings);
  const removeHolding = useHoldingsStore(s => s.removeHolding);
  const currency = useSettingsStore(s => s.currency);
  const alphaVantageApiKey = useSettingsStore(s => s.alphaVantageApiKey);

  const stockSymbols = holdings
    .filter((h): h is Extract<typeof h, { type: 'stock' }> => h.type === 'stock')
    .map(h => h.symbol);

  const { data: stockQuotes } = useStockQuotes(stockSymbols, alphaVantageApiKey);
  const quoteMap = new Map(stockQuotes?.map(q => [q.symbol, q]) ?? []);

  const cashHoldings = holdings.filter(
    (h): h is Extract<typeof h, { type: 'cash' }> => h.type === 'cash',
  );
  const stockHoldings = holdings.filter(
    (h): h is Extract<typeof h, { type: 'stock' }> => h.type === 'stock',
  );

  const totalCash = cashHoldings.reduce((sum, h) => sum + h.amount, 0);
  const totalStocks = stockHoldings.reduce((sum, h) => {
    const quote = quoteMap.get(h.symbol);
    return sum + (quote ? quote.price * h.shares : 0);
  }, 0);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Holdings</h1>
          <Button asChild>
            <Link href="/holdings/add">+ Add Holding</Link>
          </Button>
        </div>

        {holdings.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 px-6 text-center text-muted-foreground">
            <p className="text-base mb-2">No holdings yet</p>
            <p className="text-sm">
              Add cash savings or stock positions to track alongside your crypto.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Cash</div>
                <div className="text-xl font-mono font-bold">{formatFiat(totalCash, currency)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {cashHoldings.length} account{cashHoldings.length !== 1 ? 's' : ''}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Stocks</div>
                <div className="text-xl font-mono font-bold">
                  {formatFiat(totalStocks, currency)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stockHoldings.length} position{stockHoldings.length !== 1 ? 's' : ''}
                </div>
              </Card>
            </div>

            {/* Cash holdings */}
            {cashHoldings.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Cash & Savings</h2>
                <div className="flex flex-col gap-2">
                  {cashHoldings.map(h => (
                    <Card key={h.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{h.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {currencyMeta[h.currency].symbol} {h.currency.toUpperCase()}
                            {h.interestRate > 0 && ` \u00B7 ${h.interestRate}% APY`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-mono font-medium">
                              {formatFiat(h.amount, h.currency)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeHolding(h.id)}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Stock holdings */}
            {stockHoldings.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Stocks
                  {!alphaVantageApiKey && (
                    <span className="ml-2 text-xs text-warning">
                      (Add API key in Settings for live prices)
                    </span>
                  )}
                </h2>
                <div className="flex flex-col gap-2">
                  {stockHoldings.map(h => {
                    const quote = quoteMap.get(h.symbol);
                    const value = quote ? quote.price * h.shares : undefined;
                    return (
                      <Card key={h.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold">{h.symbol}</span>
                              <span className="text-sm text-muted-foreground">{h.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {h.shares} shares
                              {h.avgCostBasis !== undefined &&
                                ` \u00B7 Avg cost: ${formatFiat(h.avgCostBasis, currency)}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {value !== undefined ? (
                                <>
                                  <div className="font-mono font-medium">
                                    {formatFiat(value, currency)}
                                  </div>
                                  {quote && (
                                    <Badge
                                      variant={quote.changePercent >= 0 ? 'success' : 'error'}
                                      className="mt-0.5"
                                    >
                                      {formatChange(quote.changePercent)}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">&mdash;</span>
                              )}
                            </div>
                            <button
                              onClick={() => removeHolding(h.id)}
                              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
