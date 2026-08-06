import { useState } from 'react';
import { useAccountData } from '../hooks/useAccountData';

export function PortfolioPanel() {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'fills'>('positions');
  const { positions, openOrders, fills } = useAccountData();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-10 border-b border-border flex items-center px-4 gap-4 text-sm font-medium shrink-0">
        <button 
          onClick={() => setActiveTab('positions')}
          className={`h-full px-2 border-b-2 transition-colors ${activeTab === 'positions' ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
        >
          Positions ({positions.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`h-full px-2 border-b-2 transition-colors ${activeTab === 'orders' ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
        >
          Open Orders ({openOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('fills')}
          className={`h-full px-2 border-b-2 transition-colors ${activeTab === 'fills' ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
        >
          Fills
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {activeTab === 'positions' && (
          positions.length === 0 ? (
             <div className="p-4 text-xs text-muted-foreground text-center">No open positions</div>
          ) : (
            <table className="w-full text-left text-xs font-mono-num whitespace-nowrap">
              <thead className="bg-secondary/30 text-muted-foreground border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">Market</th>
                  <th className="px-4 py-2 font-medium">Size</th>
                  <th className="px-4 py-2 font-medium">Entry Price</th>
                  <th className="px-4 py-2 font-medium">Mark Price</th>
                  <th className="px-4 py-2 font-medium text-right">Liq. Price</th>
                  <th className="px-4 py-2 font-medium text-right">Unrealized PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {positions.map((p: any) => {
                  const pos = p.position;
                  const isLong = parseFloat(pos.szi) > 0;
                  const pnl = parseFloat(pos.unrealizedPnl);
                  return (
                    <tr key={pos.coin} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 flex items-center gap-2">
                        <div className={`w-1 h-3 rounded-full ${isLong ? 'bg-buy' : 'bg-sell'}`} />
                        <span className="font-bold text-foreground font-sans">{pos.coin}</span>
                        <span className="text-[10px] text-muted-foreground">{pos.leverage.value}x</span>
                      </td>
                      <td className={`px-4 py-2 ${isLong ? 'text-buy' : 'text-sell'}`}>{pos.szi}</td>
                      <td className="px-4 py-2">{parseFloat(pos.entryPx).toFixed(4)}</td>
                      <td className="px-4 py-2">{parseFloat(pos.positionValue) / Math.abs(parseFloat(pos.szi))}</td>
                      <td className="px-4 py-2 text-right text-sell/80">{pos.liquidationPx ? parseFloat(pos.liquidationPx).toFixed(4) : '--'}</td>
                      <td className={`px-4 py-2 text-right ${pnl >= 0 ? 'text-buy' : 'text-sell'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}
        
        {activeTab === 'orders' && (
          openOrders.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center">No open orders</div>
          ) : (
             <table className="w-full text-left text-xs font-mono-num whitespace-nowrap">
              <thead className="bg-secondary/30 text-muted-foreground border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">Market</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Side</th>
                  <th className="px-4 py-2 font-medium">Size</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium text-right">Filled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {openOrders.map((o: any) => {
                  const isBuy = o.side === 'B';
                  return (
                    <tr key={o.oid} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 font-bold text-foreground font-sans">{o.coin}</td>
                      <td className="px-4 py-2 font-sans">{o.orderType}</td>
                      <td className={`px-4 py-2 ${isBuy ? 'text-buy' : 'text-sell'}`}>{isBuy ? 'Buy' : 'Sell'}</td>
                      <td className="px-4 py-2">{o.sz}</td>
                      <td className="px-4 py-2">{o.limitPx}</td>
                      <td className="px-4 py-2 text-right">{o.filledSz || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}

        {activeTab === 'fills' && (
          fills.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center">No recent fills</div>
          ) : (
            <table className="w-full text-left text-xs font-mono-num whitespace-nowrap">
              <thead className="bg-secondary/30 text-muted-foreground border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Market</th>
                  <th className="px-4 py-2 font-medium">Side</th>
                  <th className="px-4 py-2 font-medium">Size</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {fills.slice(0, 50).map((f: any, idx: number) => {
                  const isBuy = f.side === 'B';
                  return (
                    <tr key={`${f.time}-${idx}`} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 text-muted-foreground">{new Date(f.time).toLocaleString()}</td>
                      <td className="px-4 py-2 font-bold text-foreground font-sans">{f.coin}</td>
                      <td className={`px-4 py-2 ${isBuy ? 'text-buy' : 'text-sell'}`}>{isBuy ? 'Buy' : 'Sell'}</td>
                      <td className="px-4 py-2">{f.sz}</td>
                      <td className="px-4 py-2">{f.px}</td>
                      <td className="px-4 py-2 text-right">{parseFloat(f.fee).toFixed(4)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
