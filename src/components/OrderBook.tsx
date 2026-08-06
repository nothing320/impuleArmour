import { useEffect, useState } from 'react';
import { useHyperliquidWs } from '../hooks/useHyperliquidWs';
import { useUiStore } from '../store/uiStore';

interface OrderBookProps {
  market: string;
}

interface Level {
  px: string;
  sz: string;
  n: number;
}

export function OrderBook({ market }: OrderBookProps) {
  const isTestnet = useUiStore(s => s.isTestnet);
  const { subscribe } = useHyperliquidWs(isTestnet);
  const [book, setBook] = useState<{ levels: [Level[], Level[]] }>({ levels: [[], []] });
  
  useEffect(() => {
    // Reset book on market change
    setBook({ levels: [[], []] });

    const unsub = subscribe({ type: 'l2Book', coin: market }, (data: any) => {
      if (data && data.levels) {
        setBook(data);
      }
    });

    return unsub;
  }, [market, subscribe]);

  const asks = book.levels[0] || [];
  const bids = book.levels[1] || [];

  // Sort asks descending for display (highest at top)
  const displayAsks = [...asks].reverse().slice(-15);
  // Sort bids descending
  const displayBids = bids.slice(0, 15);

  const maxAskSize = Math.max(...displayAsks.map(a => parseFloat(a.sz)), 0.001);
  const maxBidSize = Math.max(...displayBids.map(b => parseFloat(b.sz)), 0.001);
  const maxSize = Math.max(maxAskSize, maxBidSize);

  return (
    <div className="flex flex-col h-full text-xs font-mono-num">
      <div className="flex justify-between px-4 py-2 text-muted-foreground border-b border-border">
        <span>Price</span>
        <span>Size</span>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Asks (Sell) */}
        <div className="flex flex-col-reverse justify-start flex-1 overflow-hidden p-1">
          {displayAsks.map((ask, i) => {
            const sizePercent = (parseFloat(ask.sz) / maxSize) * 100;
            return (
              <div key={ask.px} className="relative flex justify-between px-3 py-[2px] cursor-pointer hover:bg-white/5">
                <div className="absolute right-0 top-0 bottom-0 bg-sell/10" style={{ width: `${sizePercent}%` }} />
                <span className="text-sell relative z-10">{parseFloat(ask.px).toFixed(4)}</span>
                <span className="text-foreground relative z-10">{parseFloat(ask.sz).toFixed(4)}</span>
              </div>
            );
          })}
        </div>

        {/* Spread */}
        <div className="flex items-center justify-between px-4 py-2 border-y border-border bg-background">
          <span className="font-bold text-foreground">
             {displayAsks.length > 0 && displayBids.length > 0 
               ? parseFloat(displayAsks[displayAsks.length - 1].px).toFixed(4)
               : '--'
             }
          </span>
        </div>

        {/* Bids (Buy) */}
        <div className="flex flex-col justify-start flex-1 overflow-hidden p-1">
          {displayBids.map((bid, i) => {
            const sizePercent = (parseFloat(bid.sz) / maxSize) * 100;
            return (
              <div key={bid.px} className="relative flex justify-between px-3 py-[2px] cursor-pointer hover:bg-white/5">
                <div className="absolute right-0 top-0 bottom-0 bg-buy/10" style={{ width: `${sizePercent}%` }} />
                <span className="text-buy relative z-10">{parseFloat(bid.px).toFixed(4)}</span>
                <span className="text-foreground relative z-10">{parseFloat(bid.sz).toFixed(4)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
