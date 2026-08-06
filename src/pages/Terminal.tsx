import { useUiStore } from '../store/uiStore';
import { useMarkets } from '../hooks/useMarkets';
import { Chart } from '../components/Chart';
import { OrderBook } from '../components/OrderBook';
import { PortfolioPanel } from '../components/PortfolioPanel';
import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { useAccountData } from '../hooks/useAccountData';
import { useAgentStore } from '../store/agentStore';
import { Zap, Search, PanelLeft, PanelRight, ChevronDown, Check, X, BookOpen, Eye, EyeOff } from 'lucide-react';
import { ExchangeClient, HttpTransport } from '@nktkas/hyperliquid';
import { AbstractWallet } from '@nktkas/hyperliquid/signing';

export function Terminal() {
  const { selectedMarket, setSelectedMarket, isTestnet } = useUiStore();
  const { markets, isLoading } = useMarkets();
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [leverage, setLeverage] = useState(1);
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  
  // UI Toggles & Search State
  const [showOrderbook, setShowOrderbook] = useState(true);
  const [showOrderPanel, setShowOrderPanel] = useState(true);
  const [marketSearch, setMarketSearch] = useState('');
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connect, connectors } = useConnect();
  const { marginSummary } = useAccountData();
  const { isActive: isAgentActive, createAgent, activateAgent, deactivateAgent, getAccount } = useAgentStore();

  const market = markets.find(m => m.name === selectedMarket) || markets[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMarketDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePlaceOrder = async () => {
    if (!size || isNaN(parseFloat(size)) || parseFloat(size) <= 0) {
      alert("Please enter a valid size");
      return;
    }
    
    if (orderType === 'limit' && (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
      alert("Please enter a valid price");
      return;
    }

    let activeWallet: AbstractWallet | null = null;
    if (isAgentActive) {
       activeWallet = getAccount() as unknown as AbstractWallet;
    } else if (walletClient) {
       // Wagmi's walletClient satisfies AbstractViemJsonRpcAccount
       activeWallet = walletClient as unknown as AbstractWallet;
    } else {
       alert("No wallet connected!");
       return;
    }

    setIsOrdering(true);
    try {
      const transport = new HttpTransport({
          apiUrl: isTestnet ? 'https://api.hyperliquid-testnet.xyz' : 'https://api.hyperliquid.xyz'
      });
      
      const exchange = new ExchangeClient({ wallet: activeWallet, transport });
      
      // Determine price for market orders - usually 0, or requires a slip limit.
      // Hyperliquid requires a limit price for frontend market orders too for slippage protection, 
      // but let's pass a price calculated with large slippage for market orders or just 0 if allowed.
      // We will use standard market fallback to a 5% slippage price.
      let orderPrice = price;
      if (orderType === 'market') {
        const livePx = parseFloat(market.liveMarkPx);
        orderPrice = orderSide === 'buy' 
          ? (livePx * 1.05).toFixed(market.szDecimals || 2) // 5% slippage up
          : (livePx * 0.95).toFixed(market.szDecimals || 2); // 5% slippage down
      }

      // We also need to check the 'reduce-only' checkbox if we had one in state, but we don't right now.
      // Let's grab it directly from the DOM since we didn't add a state for it earlier.
      const isReduceOnly = (document.getElementById('reduce-only') as HTMLInputElement)?.checked || false;

      const result = await exchange.order({
         orders: [{
            a: market.assetIndex,
            b: orderSide === 'buy',
            p: orderPrice,
            s: size,
            r: isReduceOnly,
            t: orderType === 'market' 
                 ? { limit: { tif: 'FrontendMarket' } } // Market orders use FrontendMarket TIF
                 : { limit: { tif: 'Gtc' } } // Standard limit order
         }],
         grouping: 'na'
      });
      
      if (result.status === 'ok') {
         alert(`Order placed successfully!`);
      } else {
         console.error('Order Error:', result);
         alert(`Order failed: ${JSON.stringify(result)}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error placing order: ${err.message || err}`);
    } finally {
      setIsOrdering(false);
    }
  };

  const toggleAgent = () => {
    if (isAgentActive) {
      deactivateAgent();
    } else {
      const { key, address } = createAgent();
      // In a real app, you would sign the `approveAgent` action here using Wagmi's useSignTypedData.
      alert(`Activating Agent Wallet (Mock). Address: ${address.slice(0,6)}...${address.slice(-4)}. You would normally sign an approveAgent tx with your main wallet now.`);
      activateAgent(key, address);
    }
  };

  if (isLoading || !market) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading market data...</div>;
  }

  const change24h = parseFloat(market.prevDayPx) > 0 
    ? ((parseFloat(market.liveMarkPx) - parseFloat(market.prevDayPx)) / parseFloat(market.prevDayPx)) * 100 
    : 0;

  const isPositive = change24h >= 0;


  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Market Stats Bar */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-6 shrink-0 bg-background/50 relative z-10">
        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
            className="flex items-center gap-2 hover:bg-secondary text-foreground px-3 py-1.5 rounded font-bold text-lg outline-none cursor-pointer transition-colors"
          >
            {market.name} <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {isMarketDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-md shadow-lg flex flex-col max-h-96 overflow-hidden">
              <div className="p-2 border-b border-border flex items-center gap-2 bg-secondary/30">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={marketSearch} 
                  onChange={e => setMarketSearch(e.target.value)} 
                  placeholder="Search markets..." 
                  className="bg-transparent border-none outline-none text-sm flex-1 font-sans"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 py-1">
                {markets
                  .filter(m => m.name.toLowerCase().includes(marketSearch.toLowerCase()))
                  .map(m => (
                    <button 
                      key={m.name} 
                      onClick={() => { 
                        setSelectedMarket(m.name); 
                        setIsMarketDropdownOpen(false); 
                        setMarketSearch(''); 
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary flex justify-between items-center transition-colors ${m.name === selectedMarket ? 'text-primary bg-primary/5' : 'text-foreground'}`}
                    >
                      <span className="font-bold">{m.name}</span>
                      {m.name === selectedMarket && <Check className="w-4 h-4 text-primary" />}
                    </button>
                ))}
                {markets.filter(m => m.name.toLowerCase().includes(marketSearch.toLowerCase())).length === 0 && (
                   <div className="px-4 py-4 text-center text-sm text-muted-foreground">No markets found</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mark Price</span>
          <span className={`font-mono-num font-medium ${isPositive ? 'text-buy' : 'text-sell'}`}>
            {parseFloat(market.liveMarkPx).toFixed(market.szDecimals >= 4 ? 4 : 2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">24h Change</span>
          <span className={`font-mono-num font-medium ${isPositive ? 'text-buy' : 'text-sell'}`}>
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-col hidden sm:flex">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Funding Rate</span>
          <span className="font-mono-num font-medium text-foreground">
            {(parseFloat(market.funding) * 100).toFixed(4)}%
          </span>
        </div>
        <div className="flex flex-col hidden md:flex">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Open Interest</span>
          <span className="font-mono-num font-medium text-foreground">
            {parseFloat(market.openInterest).toLocaleString(undefined, { maximumFractionDigits: 0 })} {market.name}
          </span>
        </div>

        {/* Layout Toggles */}
        <div className="flex items-center gap-1.5 ml-auto border-l border-border pl-4">
          <button 
            onClick={() => setShowOrderbook(!showOrderbook)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${showOrderbook ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            title={showOrderbook ? "Hide Order Book" : "Show Order Book"}
          >
            {showOrderbook ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-primary" />}
            <span className="hidden sm:inline">{showOrderbook ? "Hide Book" : "Show Book"}</span>
          </button>
          <button 
            onClick={() => setShowOrderPanel(!showOrderPanel)}
            className={`p-1.5 rounded transition-colors ${showOrderPanel ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            title="Toggle Order Panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chart Column */}
        <div className="flex-1 border-r border-border flex flex-col bg-card min-w-0 transition-all">
          <div className="h-10 border-b border-border flex items-center justify-between px-4 text-xs font-medium text-muted-foreground">
             <span>Chart</span>
             {!showOrderbook && (
               <button
                 onClick={() => setShowOrderbook(true)}
                 className="flex items-center gap-1 text-[11px] bg-secondary/80 hover:bg-secondary text-foreground px-2 py-0.5 rounded transition-colors"
                 title="Show Order Book"
               >
                 <BookOpen className="w-3 h-3 text-primary" />
                 Show Order Book
               </button>
             )}
          </div>
          <div className="flex-1 flex items-center justify-center border-b border-border overflow-hidden bg-black/40">
            <Chart market={market.name} />
          </div>
          {/* Bottom Panel (Positions, Orders) */}
          <div className="h-64 flex flex-col bg-background">
            {!isConnected ? (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Connect wallet to view portfolio data
              </div>
            ) : (
              <PortfolioPanel />
            )}
          </div>
        </div>

        {/* Orderbook Column */}
        {showOrderbook && (
          <div className="w-72 border-r border-border flex flex-col bg-card shrink-0">
            <div className="h-10 border-b border-border flex items-center justify-between px-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Order Book
              </span>
              <button
                onClick={() => setShowOrderbook(false)}
                className="p-1 hover:bg-secondary rounded hover:text-foreground transition-colors"
                title="Hide Order Book"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-black/20">
               <OrderBook market={market.name} />
            </div>
          </div>
        )}

        {/* Order Ticket Column */}
        {showOrderPanel && (
          <div className="w-80 flex flex-col bg-card shrink-0">
             <div className="h-10 border-b border-border flex items-center px-4 text-xs font-medium text-muted-foreground">
              Place Order
            </div>
            <div className="flex-1 p-5 flex flex-col gap-5 overflow-auto">
             <div className="flex bg-secondary p-1 rounded font-medium">
               <button 
                 onClick={() => setOrderType('market')}
                 className={`flex-1 py-1.5 text-xs rounded transition-colors ${orderType === 'market' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 Market
               </button>
               <button 
                 onClick={() => setOrderType('limit')}
                 className={`flex-1 py-1.5 text-xs rounded transition-colors ${orderType === 'limit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 Limit
               </button>
             </div>
             
             <div className="flex gap-2">
               <button 
                 onClick={() => setOrderSide('buy')}
                 className={`flex-1 border py-2.5 rounded font-bold text-sm transition-colors ${orderSide === 'buy' ? 'bg-buy/20 text-buy border-buy/50' : 'bg-transparent text-muted-foreground border-border hover:bg-secondary'}`}
               >
                 Buy / Long
               </button>
               <button 
                 onClick={() => setOrderSide('sell')}
                 className={`flex-1 border py-2.5 rounded font-bold text-sm transition-colors ${orderSide === 'sell' ? 'bg-sell/20 text-sell border-sell/50' : 'bg-transparent text-muted-foreground border-border hover:bg-secondary'}`}
               >
                 Sell / Short
               </button>
             </div>

             <div className="space-y-1.5 mt-2">
               <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Size ({market.name})</label>
               <div className="flex bg-secondary border border-border rounded px-3 py-2 items-center focus-within:border-primary/50 transition-colors">
                 <input 
                   type="number" 
                   value={size}
                   onChange={(e) => setSize(e.target.value)}
                   className="bg-transparent flex-1 outline-none font-mono-num text-sm" 
                   placeholder="0.00" 
                 />
                 <span className="text-xs text-muted-foreground">{market.name}</span>
               </div>
             </div>
             
             {orderType === 'limit' && (
               <div className="space-y-1.5">
                 <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price (USD)</label>
                 <div className="flex bg-secondary border border-border rounded px-3 py-2 items-center focus-within:border-primary/50 transition-colors">
                   <input 
                     type="number" 
                     value={price}
                     onChange={(e) => setPrice(e.target.value)}
                     className="bg-transparent flex-1 outline-none font-mono-num text-sm" 
                     placeholder="0.00" 
                   />
                   <span className="text-xs text-muted-foreground">USD</span>
                 </div>
               </div>
             )}

             <div className="space-y-2 mt-2">
               <div className="flex justify-between items-center">
                 <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Leverage</label>
                 <span className="text-xs font-mono-num font-medium bg-secondary px-2 py-0.5 rounded">{leverage}x</span>
               </div>
               <input 
                 type="range" 
                 min="1" 
                 max={market.maxLeverage || 50} 
                 value={leverage}
                 onChange={(e) => setLeverage(parseInt(e.target.value))}
                 className="w-full accent-primary h-1" 
               />
               <div className="flex justify-between text-[10px] text-muted-foreground font-mono-num">
                 <span>1x</span>
                 <span>{market.maxLeverage || 50}x</span>
               </div>
             </div>

             <div className="flex items-center gap-2 mt-1">
               <input type="checkbox" id="reduce-only" className="accent-primary" />
               <label htmlFor="reduce-only" className="text-xs text-muted-foreground cursor-pointer select-none">Reduce Only</label>
             </div>

             <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
               <div className="flex justify-between text-xs items-center">
                 <span className="text-muted-foreground">1-Click Trading</span>
                 {isConnected && (
                   <button 
                     onClick={toggleAgent}
                     className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${isAgentActive ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border hover:bg-secondary/80'}`}
                   >
                     <Zap className="w-3 h-3" />
                     {isAgentActive ? 'Active' : 'Enable Agent'}
                   </button>
                 )}
               </div>

               <div className="flex justify-between text-xs mt-2">
                 <span className="text-muted-foreground">Available Margin</span>
                 <span className="font-mono-num text-foreground">
                   {isConnected && marginSummary ? `$${parseFloat(marginSummary.accountValue).toFixed(2)}` : '-- USD'}
                 </span>
               </div>
               
               {isConnected ? (
                 <button 
                   onClick={handlePlaceOrder}
                   disabled={isOrdering}
                   className={`w-full py-3 rounded font-bold text-sm transition-colors ${orderSide === 'buy' ? 'bg-buy hover:bg-buy/90 text-background' : 'bg-sell hover:bg-sell/90 text-background'} ${isOrdering ? 'opacity-70 cursor-not-allowed' : ''}`}
                 >
                   {isOrdering ? 'Placing...' : `Place ${orderType === 'market' ? 'Market' : 'Limit'} ${orderSide === 'buy' ? 'Buy' : 'Sell'}`}
                 </button>
               ) : (
                 <button 
                   onClick={() => {
                     if (!(window as any).ethereum) {
                       alert("No wallet detected! If you are in the preview iframe, please open the app in a new tab.");
                       return;
                     }
                     connect({ connector: connectors[0] });
                   }}
                   className="w-full bg-primary/10 text-primary border border-primary/20 py-3 rounded font-bold text-sm hover:bg-primary/20 transition-colors"
                 >
                   Connect Wallet to Trade
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
