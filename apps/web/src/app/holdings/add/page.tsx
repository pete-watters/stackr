'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CurrencySchema, currencyMeta } from '@stackr/models';
import type { Currency } from '@stackr/models';
import { useStockSearch } from '@stackr/queries';
import { Button, Input, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@stackr/ui';
import { useHoldingsStore } from '@/lib/holdings-store';
import { useSettingsStore } from '@/lib/settings-store';
import { Header } from '@/components/header';

const currencies = CurrencySchema.options;

export default function AddHoldingPage() {
  const router = useRouter();
  const addCashHolding = useHoldingsStore(s => s.addCashHolding);
  const addStockHolding = useHoldingsStore(s => s.addStockHolding);
  const alphaVantageApiKey = useSettingsStore(s => s.alphaVantageApiKey);

  // Cash form state
  const [cashLabel, setCashLabel] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashCurrency, setCashCurrency] = useState<Currency>('usd');
  const [cashRate, setCashRate] = useState('');

  // Stock form state
  const [stockQuery, setStockQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
  const [shares, setShares] = useState('');
  const [costBasis, setCostBasis] = useState('');

  const { data: searchResults } = useStockSearch(stockQuery, alphaVantageApiKey);

  const handleCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashLabel || !cashAmount) return;
    addCashHolding({
      label: cashLabel,
      amount: parseFloat(cashAmount),
      currency: cashCurrency,
      interestRate: cashRate ? parseFloat(cashRate) : 0,
    });
    router.push('/holdings');
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !shares) return;
    addStockHolding({
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      shares: parseFloat(shares),
      avgCostBasis: costBasis ? parseFloat(costBasis) : undefined,
    });
    router.push('/holdings');
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Add Holding</h1>

        <Tabs defaultValue="cash">
          <TabsList className="w-full">
            <TabsTrigger value="cash" className="flex-1">
              Cash
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex-1">
              Stock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cash">
            <Card className="p-4 mt-4">
              <form onSubmit={handleCashSubmit} className="flex flex-col gap-4">
                <Input
                  label="Label"
                  value={cashLabel}
                  onChange={e => setCashLabel(e.target.value)}
                  placeholder="e.g. High-yield savings"
                  required
                />
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  placeholder="10000.00"
                  required
                />
                <div className="space-y-1.5">
                  <label
                    htmlFor="cash-currency"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Currency
                  </label>
                  <select
                    id="cash-currency"
                    value={cashCurrency}
                    onChange={e => setCashCurrency(e.target.value as Currency)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {currencies.map(c => (
                      <option key={c} value={c}>
                        {currencyMeta[c].symbol} {currencyMeta[c].name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Interest Rate (APY %)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={cashRate}
                  onChange={e => setCashRate(e.target.value)}
                  placeholder="4.5"
                />
                <Button type="submit" className="mt-2">
                  Add Cash Holding
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="stock">
            <Card className="p-4 mt-4">
              {!alphaVantageApiKey ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  <p className="mb-2">An Alpha Vantage API key is required for stock search.</p>
                  <Button asChild variant="outline" size="sm">
                    <a href="/settings">Go to Settings</a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleStockSubmit} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">
                      Search Stock
                    </label>
                    <Input
                      value={stockQuery}
                      onChange={e => {
                        setStockQuery(e.target.value);
                        setSelectedStock(null);
                      }}
                      placeholder="Search by symbol or name..."
                    />
                    {searchResults && searchResults.length > 0 && !selectedStock && (
                      <div className="border rounded-md max-h-48 overflow-auto">
                        {searchResults.map(r => (
                          <button
                            key={r.symbol}
                            type="button"
                            onClick={() => {
                              setSelectedStock({ symbol: r.symbol, name: r.name });
                              setStockQuery(r.symbol);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
                          >
                            <span>
                              <span className="font-mono font-semibold">{r.symbol}</span>
                              <span className="ml-2 text-muted-foreground">{r.name}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">{r.region}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedStock && (
                      <div className="text-sm text-success">
                        Selected: {selectedStock.symbol} — {selectedStock.name}
                      </div>
                    )}
                  </div>
                  <Input
                    label="Number of Shares"
                    type="number"
                    step="0.001"
                    min="0"
                    value={shares}
                    onChange={e => setShares(e.target.value)}
                    placeholder="100"
                    required
                  />
                  <Input
                    label="Average Cost Basis (optional)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costBasis}
                    onChange={e => setCostBasis(e.target.value)}
                    placeholder="150.00"
                  />
                  <Button type="submit" className="mt-2" disabled={!selectedStock}>
                    Add Stock Holding
                  </Button>
                </form>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
