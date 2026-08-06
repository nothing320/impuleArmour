import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';

interface AgentState {
  agentKey: string | null;
  agentAddress: string | null;
  isActive: boolean;
  createAgent: () => { key: string; address: string };
  activateAgent: (key: string, address: string) => void;
  deactivateAgent: () => void;
  getAccount: () => PrivateKeyAccount | null;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agentKey: null,
      agentAddress: null,
      isActive: false,

      createAgent: () => {
        const pk = generatePrivateKey();
        const account = privateKeyToAccount(pk);
        return { key: pk, address: account.address };
      },

      activateAgent: (key, address) => {
        set({ agentKey: key, agentAddress: address, isActive: true });
      },

      deactivateAgent: () => {
        set({ agentKey: null, agentAddress: null, isActive: false });
      },

      getAccount: () => {
        const { agentKey } = get();
        if (!agentKey) return null;
        return privateKeyToAccount(agentKey as `0x${string}`);
      },
    }),
    {
      name: 'hyperliquid-agent-storage',
    }
  )
);
