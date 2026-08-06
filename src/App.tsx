import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Link, useLocation } from 'react-router-dom';
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { useUiStore } from './store/uiStore';
import { Terminal } from './pages/Terminal';
import { Markets } from './pages/Markets';
import { Portfolio } from './pages/Portfolio';
import { Activity, LayoutDashboard, Wallet, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './lib/firebase';
import { User } from 'firebase/auth';


// Setup Wagmi
const wagmiConfig = createConfig({
  chains: [arbitrum],
  connectors: [injected()],
  transports: {
    [arbitrum.id]: http(),
  },
});

const queryClient = new QueryClient();

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button 
        onClick={() => disconnect()}
        className="text-xs font-mono-num bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }
  return (
    <button 
      onClick={() => {
        if (!(window as any).ethereum) {
          alert("No wallet detected! Please install MetaMask. If you are viewing this in a preview iframe, click 'Open in New Tab' at the top right.");
          return;
        }
        connect({ connector: connectors[0] });
      }}
      className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded flex items-center gap-2"
    >
      <Wallet className="w-3.5 h-3.5" />
      Connect Web3
    </button>
  );
}

function FirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Firebase auth error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase logout error:", error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded">
        {user.photoURL ? (
          <img src={user.photoURL} alt="User" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <UserIcon className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-medium truncate max-w-[100px]">{user.displayName || user.email}</span>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground ml-1">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="text-xs font-medium bg-secondary text-foreground border border-border hover:bg-secondary/80 px-3 py-1.5 rounded flex items-center gap-2"
    >
      <UserIcon className="w-3.5 h-3.5" />
      Sign in (Google)
    </button>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isTestnet, setIsTestnet, theme, setTheme } = useUiStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            HL Terminal
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link to="/" className={`px-3 py-1.5 rounded ${location.pathname === '/' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Trade</Link>
            <Link to="/markets" className={`px-3 py-1.5 rounded ${location.pathname === '/markets' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Markets</Link>
            <Link to="/portfolio" className={`px-3 py-1.5 rounded ${location.pathname === '/portfolio' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Portfolio</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className={isTestnet ? 'text-primary' : 'text-muted-foreground'}>Testnet</span>
            <button 
              onClick={() => setIsTestnet(!isTestnet)}
              className="w-8 h-4 bg-secondary rounded-full relative"
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-foreground rounded-full transition-all ${isTestnet ? 'left-0.5' : 'left-4'}`} />
            </button>
            <span className={!isTestnet ? 'text-primary' : 'text-muted-foreground'}>Mainnet</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <FirebaseAuth />
            <WalletConnect />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Terminal />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/portfolio" element={<Portfolio />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
