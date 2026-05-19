const AV_BASE = 'https://www.alphavantage.co/query';

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function searchStocks(query: string, apiKey: string): Promise<StockSearchResult[]> {
  const url = `${AV_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Alpha Vantage API error: ${res.status}`);
  }

  const data = await res.json();
  const matches = data.bestMatches ?? [];

  return matches.map(
    (m: Record<string, string>): StockSearchResult => ({
      symbol: m['1. symbol'] ?? '',
      name: m['2. name'] ?? '',
      type: m['3. type'] ?? '',
      region: m['4. region'] ?? '',
      currency: m['8. currency'] ?? 'USD',
    }),
  );
}

export async function fetchStockQuote(symbol: string, apiKey: string): Promise<StockQuote> {
  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Alpha Vantage API error: ${res.status}`);
  }

  const data = await res.json();
  const quote = data['Global Quote'] ?? {};

  return {
    symbol: quote['01. symbol'] ?? symbol,
    price: parseFloat(quote['05. price'] ?? '0'),
    change: parseFloat(quote['09. change'] ?? '0'),
    changePercent: parseFloat((quote['10. change percent'] ?? '0').replace('%', '')),
  };
}

export async function fetchStockQuotes(symbols: string[], apiKey: string): Promise<StockQuote[]> {
  const results = await Promise.allSettled(symbols.map(s => fetchStockQuote(s, apiKey)));

  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
    .map(r => r.value);
}
