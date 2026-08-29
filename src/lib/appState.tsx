import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type NetworkStatus = 'online' | 'offline';

type AppState = {
  networkStatus: NetworkStatus;
  pendingSyncCount: number;
  nightMode: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  setNetworkStatus: (s: NetworkStatus) => void;
  incrementPendingSync: () => void;
  clearPendingSync: () => void;
  toggleNightMode: () => void;
  setSyncing: (v: boolean) => void;
  setLastSyncTime: (t: number) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('offline');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [nightMode, setNightMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const incrementPendingSync = useCallback(() => {
    setPendingSyncCount((c) => c + 1);
  }, []);

  const clearPendingSync = useCallback(() => {
    setPendingSyncCount(0);
  }, []);

  const toggleNightMode = useCallback(() => {
    setNightMode((v) => !v);
  }, []);

  const setSyncing = useCallback((v: boolean) => {
    setIsSyncing(v);
  }, []);

  return (
    <AppContext.Provider
      value={{
        networkStatus,
        pendingSyncCount,
        nightMode,
        isSyncing,
        lastSyncTime,
        setNetworkStatus,
        incrementPendingSync,
        clearPendingSync,
        toggleNightMode,
        setSyncing,
        setLastSyncTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
