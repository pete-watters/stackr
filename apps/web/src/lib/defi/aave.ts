import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { mainnet } from 'viem/chains';

/**
 * Aave v3 liquidation health for a wallet, read straight from the chain.
 *
 * `Pool.getUserAccountData(user)` returns the user's aggregate position with an
 * **on-chain-computed health factor** (Aave's own oracle prices). No subgraph,
 * no API key, no price stream needed — one read-only call gives the live HF.
 * HF < 1 means the position is liquidatable. See issue #46 for the wider DeFi
 * data architecture.
 */

// Aave v3 Pool, Ethereum mainnet.
const AAVE_V3_POOL: Address = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

const POOL_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Aave reports base-currency amounts (USD) with 8 decimals; HF with 18.
const BASE_DECIMALS = 8;
const HF_DECIMALS = 18;
// healthFactor is uint256.max when there's no debt — treat as "no borrow".
const NO_DEBT_HF = 2n ** 256n - 1n;

export interface AaveHealth {
  address: string;
  healthFactor: number;
  ltv: number; // basis points → fraction (e.g. 0.8)
  liquidationThreshold: number; // fraction
  totalCollateralUsd: number;
  totalDebtUsd: number;
  availableBorrowsUsd: number;
}

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const client = createPublicClient({
  chain: mainnet,
  transport: alchemyKey ? http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`) : http(),
});

/**
 * Fetch a wallet's Aave v3 position health, or null if it has no borrow
 * position (nothing to be liquidated).
 */
export async function fetchAaveHealth(address: string): Promise<AaveHealth | null> {
  const [collateral, debt, available, liqThreshold, ltv, hf] = await client.readContract({
    address: AAVE_V3_POOL,
    abi: POOL_ABI,
    functionName: 'getUserAccountData',
    args: [address as Address],
  });

  // No debt → no liquidation risk → no card to show.
  if (debt === 0n || hf === NO_DEBT_HF) return null;

  return {
    address,
    healthFactor: Number(formatUnits(hf, HF_DECIMALS)),
    ltv: Number(ltv) / 10_000,
    liquidationThreshold: Number(liqThreshold) / 10_000,
    totalCollateralUsd: Number(formatUnits(collateral, BASE_DECIMALS)),
    totalDebtUsd: Number(formatUnits(debt, BASE_DECIMALS)),
    availableBorrowsUsd: Number(formatUnits(available, BASE_DECIMALS)),
  };
}
