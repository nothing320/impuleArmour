import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { HYPERLIQUID_API_URL, HYPERLIQUID_TESTNET_API_URL } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import { useHyperliquidWs } from './useHyperliquidWs';
import { useEffect } from 'react';

export function useAccountData() {
  const { address, isConnected } = useAccount();
  const isTestnet = useUiStore(s => s.isTestnet);
  const { subscribe } = useHyperliquidWs(isTestnet);

  const { data: clearinghouseState, refetch: refetchState } = useQuery({
    queryKey: ['clearinghouseState', address, isTestnet],
    queryFn: async () => {
      if (!address) return null;
      const url = isTestnet ? HYPERLIQUID_TESTNET_API_URL : HYPERLIQUID_API_URL;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clearinghouseState', user: address }),
      });
      return res.json();
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000,
  });

  const { data: openOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['openOrders', address, isTestnet],
    queryFn: async () => {
      if (!address) return [];
      const url = isTestnet ? HYPERLIQUID_TESTNET_API_URL : HYPERLIQUID_API_URL;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'frontendOpenOrders', user: address }),
      });
      return res.json();
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000,
  });
  
  const { data: fills, refetch: refetchFills } = useQuery({
    queryKey: ['userFills', address, isTestnet],
    queryFn: async () => {
      if (!address) return [];
      const url = isTestnet ? HYPERLIQUID_TESTNET_API_URL : HYPERLIQUID_API_URL;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'userFills', user: address }),
      });
      return res.json();
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!address) return;
    const unsub = subscribe({ type: 'webData2', user: address }, (data: any) => {
       // Refresh REST data when ws event hits
       refetchState();
       refetchOrders();
       refetchFills();
    });
    return unsub;
  }, [address, subscribe, refetchState, refetchOrders, refetchFills]);

  const positions = clearinghouseState?.assetPositions || [];
  const marginSummary = clearinghouseState?.marginSummary || {
    accountValue: '0',
    totalMarginUsed: '0',
    totalNtlPos: '0',
    totalRawUsd: '0',
  };

  return {
    positions,
    marginSummary,
    openOrders: openOrders || [],
    fills: fills || [],
  };
}
