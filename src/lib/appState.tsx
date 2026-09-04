import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type NetworkStatus = 'online' | 'offline';

export type Role = 'junior_officer' | 'captain' | 'dpa';

export type RoleConfig = {
  id: Role;
  label: string;
  shortLabel: string;
  userName: string;
  canSign: boolean;
  canLock: boolean;
  canCloseAudit: boolean;
  canPushTemplates: boolean;
  canViewFleetAnalytics: boolean;
  canViewDefectTracker: boolean;
  viewMode: 'tablet' | 'office';
};

export const ROLES: Record<Role, RoleConfig> = {
  junior_officer: {
    id: 'junior_officer',
    label: 'Junior Officer (Deck/Engine)',
    shortLabel: 'Junior Officer',
    userName: '3rd Eng. Nikos P.',
    canSign: false,
    canLock: false,
    canCloseAudit: false,
    canPushTemplates: false,
    canViewFleetAnalytics: false,
    canViewDefectTracker: true,
    viewMode: 'tablet',
  },
  captain: {
    id: 'captain',
    label: 'Captain / Chief Engineer',
    shortLabel: 'Captain / C/E',
    userName: 'Master Capt. Elias K.',
    canSign: true,
    canLock: true,
    canCloseAudit: true,
    canPushTemplates: false,
    canViewFleetAnalytics: false,
    canViewDefectTracker: true,
    viewMode: 'tablet',
  },
  dpa: {
    id: 'dpa',
    label: 'DPA / Fleet Manager (Office)',
    shortLabel: 'DPA / Fleet Mgr',
    userName: 'DPA S. Andersson',
    canSign: false,
    canLock: false,
    canCloseAudit: false,
    canPushTemplates: true,
    canViewFleetAnalytics: true,
    canViewDefectTracker: true,
    viewMode: 'office',
  },
};

export type Defect = {
  id: string;
  ship_id: string;
  ship_name: string;
  inspection_id: string | null;
  inspection_item_id: string | null;
  title: string;
  severity: 'low' | 'medium' | 'critical';
  assigned_officer: string;
  target_resolution_date: string;
  status: 'open' | 'in_progress' | 'resolved';
  photo_label: string | null;
  photo_compressed_size: string | null;
  photo_original_size: string | null;
  created_by_role: Role;
  created_by_name: string;
  gps_coordinates: string;
  checklist_ref: string | null;
  created_at: string;
};

export type AuditLogEntry = {
  id: string;
  inspection_id: string | null;
  ship_id: string | null;
  action: string;
  action_type: string;
  user_name: string;
  user_role: Role;
  gps_coordinates: string;
  item_key: string | null;
  item_question: string | null;
  created_at: string;
};

type AppState = {
  networkStatus: NetworkStatus;
  pendingSyncCount: number;
  nightMode: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  role: Role;
  defects: Defect[];
  auditLog: AuditLogEntry[];
  setNetworkStatus: (s: NetworkStatus) => void;
  incrementPendingSync: () => void;
  clearPendingSync: () => void;
  toggleNightMode: () => void;
  setSyncing: (v: boolean) => void;
  setLastSyncTime: (t: number) => void;
  setRole: (r: Role) => void;
  addDefect: (d: Omit<Defect, 'id' | 'created_at'>) => Defect;
  updateDefect: (id: string, updates: Partial<Defect>) => void;
  addAuditEntry: (e: Omit<AuditLogEntry, 'id' | 'created_at'>) => void;
};

const AppContext = createContext<AppState | null>(null);

function randomGps(): string {
  const latDeg = Math.floor(Math.random() * 50) + 20;
  const latMin = Math.floor(Math.random() * 60);
  const lonDeg = Math.floor(Math.random() * 60) + 5;
  const lonMin = Math.floor(Math.random() * 60);
  return `${latDeg}°${String(latMin).padStart(2, '0')}'N ${lonDeg}°${String(lonMin).padStart(2, '0')}'E`;
}

const SEED_DEFECTS: Defect[] = [
  {
    id: 'seed-defect-1',
    ship_id: 'seed-ship-nereus',
    ship_name: 'C/V NEREUS',
    inspection_id: null,
    inspection_item_id: null,
    title: 'Oily Water Separator valve failure',
    severity: 'critical',
    assigned_officer: '2nd Engineer',
    target_resolution_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    status: 'open',
    photo_label: 'defect_3847.jpg',
    photo_compressed_size: '180 KB',
    photo_original_size: '4.2 MB',
    created_by_role: 'junior_officer',
    created_by_name: '3rd Eng. Nikos P.',
    gps_coordinates: "55°12'N 12°45'E",
    checklist_ref: 'Paris MOU Port State Control',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'seed-defect-2',
    ship_id: 'seed-ship-triton',
    ship_name: 'M/V TRITON',
    inspection_id: null,
    inspection_item_id: null,
    title: 'Emergency fire pump pressure below minimum',
    severity: 'medium',
    assigned_officer: 'Bosun',
    target_resolution_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    status: 'in_progress',
    photo_label: 'defect_2913.jpg',
    photo_compressed_size: '165 KB',
    photo_original_size: '3.8 MB',
    created_by_role: 'junior_officer',
    created_by_name: '3rd Officer R. Jensen',
    gps_coordinates: "58°15'N 10°30'E",
    checklist_ref: 'USCG Foreign Vessel Pre-Arrival',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'seed-defect-3',
    ship_id: 'seed-ship-glory',
    ship_name: 'M/V AEGEAN GLORY',
    inspection_id: null,
    inspection_item_id: null,
    title: 'Garbage Record Book Part I missing entry',
    severity: 'low',
    assigned_officer: 'Chief Officer',
    target_resolution_date: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
    status: 'open',
    photo_label: null,
    photo_compressed_size: null,
    photo_original_size: null,
    created_by_role: 'junior_officer',
    created_by_name: '3rd Eng. Nikos P.',
    gps_coordinates: "37°26'N 24°56'E",
    checklist_ref: 'MARPOL Special Area Checklists',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('offline');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [nightMode, setNightMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [role, setRole] = useState<Role>('junior_officer');
  const [defects, setDefects] = useState<Defect[]>(SEED_DEFECTS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

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

  const addDefect = useCallback((d: Omit<Defect, 'id' | 'created_at'>): Defect => {
    const newDefect: Defect = {
      ...d,
      id: `defect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    setDefects((prev) => [newDefect, ...prev]);
    return newDefect;
  }, []);

  const updateDefect = useCallback((id: string, updates: Partial<Defect>) => {
    setDefects((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const addAuditEntry = useCallback((e: Omit<AuditLogEntry, 'id' | 'created_at'>) => {
    const entry: AuditLogEntry = {
      ...e,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    setAuditLog((prev) => [entry, ...prev]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        networkStatus,
        pendingSyncCount,
        nightMode,
        isSyncing,
        lastSyncTime,
        role,
        defects,
        auditLog,
        setNetworkStatus,
        incrementPendingSync,
        clearPendingSync,
        toggleNightMode,
        setSyncing,
        setLastSyncTime,
        setRole,
        addDefect,
        updateDefect,
        addAuditEntry,
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

export function generateGps(): string {
  return randomGps();
}
