import type { Chain, Currency, Price, PriceHistoryPoint } from '@stackr/models';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const chainToCoinGeckoId: Record<Chain, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  stx: 'blockstack',
  sol: 'solana',
};

export async function fetchPrices(chains: Chain[], currency: Currency = 'usd'): Promise<Price[]> {
  const ids = chains.map(c => chainToCoinGeckoId[c]).join(',');
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=${currency},usd&include_24hr_change=true`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = await res.json();
  const now = new Date().toISOString();

  return chains.map(chain => {
    const id = chainToCoinGeckoId[chain];
    const entry = data[id];

    return {
      chain,
      usdPrice: entry?.usd ?? 0,
      fiatPrice: entry?.[currency] ?? entry?.usd ?? 0,
      currency,
      change24h: entry?.usd_24h_change ?? 0,
      updatedAt: now,
    };
  });
}

export async function fetchPriceHistory(
  chain: Chain,
  days: number = 7,
  currency: Currency = 'usd',
): Promise<PriceHistoryPoint[]> {
  const id = chainToCoinGeckoId[chain];
  const url = `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.prices as [number, number][]).map(([timestamp, price]) => ({
    timestamp,
    price,
  }));
}
