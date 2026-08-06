import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  isTestnet: boolean;
  setIsTestnet: (val: boolean) => void;
  selectedMarket: string;
  setSelectedMarket: (val: string) => void;
  chartTimeframe: string;
  setChartTimeframe: (val: string) => void;
  theme: 'light' | 'dark';
  setTheme: (val: 'light' | 'dark') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isTestnet: true,
      setIsTestnet: (isTestnet) => set({ isTestnet }),
      selectedMarket: 'BTC',
      setSelectedMarket: (selectedMarket) => set({ selectedMarket }),
      chartTimeframe: '15m',
      setChartTimeframe: (chartTimeframe) => set({ chartTimeframe }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'hl-terminal-ui',
    }
  )
);
