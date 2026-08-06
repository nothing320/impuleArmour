import { useEffect, useRef, useState, useCallback } from 'react';
import { HYPERLIQUID_WS_URL, HYPERLIQUID_TESTNET_WS_URL } from '../lib/api';

type WsState = 'connecting' | 'connected' | 'disconnected';

export function useHyperliquidWs(isTestnet = false) {
  const [state, setState] = useState<WsState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const url = isTestnet ? HYPERLIQUID_TESTNET_WS_URL : HYPERLIQUID_WS_URL;
    let ws = new WebSocket(url);
    wsRef.current = ws;

    setState('connecting');

    ws.onopen = () => {
      setState('connected');
      // Resubscribe to all active topics
      subscribersRef.current.forEach((_, topicStr) => {
        const topic = JSON.parse(topicStr);
        ws.send(JSON.stringify({ method: 'subscribe', subscription: topic }));
      });
    };

    ws.onclose = () => {
      setState('disconnected');
      // Simple reconnect logic
      setTimeout(() => {
        if (wsRef.current === ws) { // Ensure we don't reconnect if unmounted
           // Handled by next effect cycle if we forced it, but let's just do basic
        }
      }, 3000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.channel) {
        // e.g. data = { channel: 'l2Book', data: { coin: 'BTC', ... } }
        // Find subscribers
        for (const [topicStr, callbacks] of subscribersRef.current.entries()) {
          const topic = JSON.parse(topicStr);
          if (topic.type === data.channel) {
            // Further match by coin if present
            if (topic.coin && data.data.coin && topic.coin !== data.data.coin) continue;
            callbacks.forEach(cb => cb(data.data));
          }
        }
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isTestnet]);

  const subscribe = useCallback((topic: any, callback: (data: any) => void) => {
    const topicStr = JSON.stringify(topic);
    if (!subscribersRef.current.has(topicStr)) {
      subscribersRef.current.set(topicStr, new Set());
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ method: 'subscribe', subscription: topic }));
      }
    }
    subscribersRef.current.get(topicStr)!.add(callback);

    return () => {
      const callbacks = subscribersRef.current.get(topicStr);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscribersRef.current.delete(topicStr);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ method: 'unsubscribe', subscription: topic }));
          }
        }
      }
    };
  }, []);

  return { state, subscribe };
}
