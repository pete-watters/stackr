import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

function getPublicClient() {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  return createPublicClient({
    chain: mainnet,
    transport: alchemyKey ? http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`) : http(),
  });
}

export function useEnsName(address?: `0x${string}`) {
  return useQuery({
    queryKey: ['ens', 'name', address],
    queryFn: () => getPublicClient().getEnsName({ address: address! }),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnsAddress(name?: string) {
  return useQuery({
    queryKey: ['ens', 'address', name],
    queryFn: () => getPublicClient().getEnsAddress({ name: name! }),
    enabled: !!name && name.endsWith('.eth'),
    staleTime: 5 * 60 * 1000,
  });
}
