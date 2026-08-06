export const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';
export const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws';

export const HYPERLIQUID_TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz/info';
export const HYPERLIQUID_TESTNET_WS_URL = 'wss://api.hyperliquid-testnet.xyz/ws';

export interface MetaAndAssetCtxs {
  universe: Array<{ name: string; szDecimals: number; maxLeverage: number; onlyIsolated?: boolean }>;
  ctxs: Array<{
    funding: string;
    openInterest: string;
    prevDayPx: string;
    dayNtlVlm: string;
    premium: string;
    oraclePx: string;
    markPx: string;
    midPx: string;
  }>;
}

export async function fetchMetaAndAssetCtxs(isTestnet = false): Promise<MetaAndAssetCtxs> {
  const url = isTestnet ? HYPERLIQUID_TESTNET_API_URL : HYPERLIQUID_API_URL;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  });
  if (!res.ok) throw new Error('Failed to fetch metaAndAssetCtxs');
  const data = await res.json();
  
  // The API returns [meta, assetCtxs]
  return {
    universe: data[0].universe,
    ctxs: data[1],
  };
}
