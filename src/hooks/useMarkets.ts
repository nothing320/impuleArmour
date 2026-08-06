import { useQuery } from '@tanstack/react-query';
import { fetchMetaAndAssetCtxs } from '../lib/api';
import { useHyperliquidWs } from './useHyperliquidWs';
import { useUiStore } from '../store/uiStore';
import { useEffect, useState } from 'react';

export function useMarkets() {
  const isTestnet = useUiStore((s) => s.isTestnet);
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['markets', isTestnet],
    queryFn: () => fetchMetaAndAssetCtxs(isTestnet),
    refetchInterval: 60000, // Background refresh
  });

  const { subscribe } = useHyperliquidWs(isTestnet);
  const [livePrices, setLivePrices] = useState<Record<string, string>>({});

  useEffect(() => {
    // Subscribe to allMids to get live mark prices
    const unsubscribe = subscribe({ type: 'allMids' }, (data: any) => {
      if (data && data.mids) {
        setLivePrices(data.mids);
      }
    });
    return unsubscribe;
  }, [subscribe]);

  const markets = initialData?.universe.map((asset, idx) => {
    const ctx = initialData.ctxs[idx];
    const livePx = livePrices[asset.name] || ctx.markPx;
    return {
      ...asset,
      ...ctx,
      assetIndex: idx,
      liveMarkPx: livePx,
    };
  }) || [];

  return { markets, isLoading };
}
