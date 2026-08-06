import { useAccount, useConnect } from 'wagmi';
import { useAccountData } from '../hooks/useAccountData';
import { PortfolioPanel } from '../components/PortfolioPanel';
import { Wallet } from 'lucide-react';

export function Portfolio() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { marginSummary } = useAccountData();

  if (!isConnected) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <p className="text-muted-foreground text-sm">Please connect your EVM wallet to view your portfolio, open positions, and account history.</p>
          <button 
             onClick={() => {
               if (!(window as any).ethereum) {
                 alert("No wallet detected! If you are in the preview iframe, please open the app in a new tab.");
                 return;
               }
               connect({ connector: connectors[0] });
             }}
             className="bg-primary text-primary-foreground font-medium px-4 py-2 rounded mt-4"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto flex flex-col">
      <h1 className="text-2xl font-bold mb-2">Portfolio</h1>
      <p className="text-muted-foreground mb-8 text-sm font-mono-num">{address}</p>

      <div className="grid grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Account Value</div>
          <div className="text-3xl font-mono-num font-bold">${parseFloat(marginSummary.accountValue).toFixed(2)}</div>
        </div>
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Margin Usage</div>
          <div className="text-3xl font-mono-num font-bold">
            {parseFloat(marginSummary.accountValue) > 0 
              ? ((parseFloat(marginSummary.totalMarginUsed) / parseFloat(marginSummary.accountValue)) * 100).toFixed(2) 
              : '0.00'}%
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Notional Position</div>
          <div className="text-3xl font-mono-num font-bold text-muted-foreground">${parseFloat(marginSummary.totalNtlPos).toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex-1 flex flex-col min-h-[400px]">
         <PortfolioPanel />
      </div>
    </div>
  );
}

