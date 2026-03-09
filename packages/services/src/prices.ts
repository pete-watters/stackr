import type { Chain, Price, PriceHistoryPoint } from '@stackr/models';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const chainToCoinGeckoId: Record<Chain, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  stx: 'blockstack',
  sol: 'solana',
};

export async function fetchPrices(chains: Chain[]): Promise<Price[]> {
  const ids = chains.map(c => chainToCoinGeckoId[c]).join(',');
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
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
      change24h: entry?.usd_24h_change ?? 0,
      updatedAt: now,
    };
  });
}

export async function fetchPriceHistory(
  chain: Chain,
  days: number = 7,
): Promise<PriceHistoryPoint[]> {
  const id = chainToCoinGeckoId[chain];
  const url = `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
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
