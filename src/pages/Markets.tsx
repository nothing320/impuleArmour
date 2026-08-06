import { useMarkets } from '../hooks/useMarkets';
import { useUiStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';

export function Markets() {
  const { markets, isLoading } = useMarkets();
  const { setSelectedMarket } = useUiStore();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading markets...</div>;
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Markets</h1>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Market</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Mark Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">24h Change</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Funding Rate</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Open Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {markets.map((m) => {
              const change24h = parseFloat(m.prevDayPx) > 0 
                ? ((parseFloat(m.liveMarkPx) - parseFloat(m.prevDayPx)) / parseFloat(m.prevDayPx)) * 100 
                : 0;
              const isPositive = change24h >= 0;
              return (
                <tr 
                  key={m.name} 
                  className="hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedMarket(m.name);
                    navigate('/');
                  }}
                >
                  <td className="px-4 py-3 font-bold">{m.name}</td>
                  <td className="px-4 py-3 font-mono-num">{parseFloat(m.liveMarkPx).toFixed(m.szDecimals >= 4 ? 4 : 2)}</td>
                  <td className={`px-4 py-3 font-mono-num ${isPositive ? 'text-buy' : 'text-sell'}`}>
                    {isPositive ? '+' : ''}{change24h.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 font-mono-num text-right">{(parseFloat(m.funding) * 100).toFixed(4)}%</td>
                  <td className="px-4 py-3 font-mono-num text-right">{parseFloat(m.openInterest).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
