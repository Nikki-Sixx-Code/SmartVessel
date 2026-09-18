import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('offline');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [nightMode, setNightMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [role, setRole] = useState<Role>('junior_officer');
  const [defects, setDefects] = useState<Defect[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    (async () => {
      const { data: dbDefects } = await supabase
        .from('defects')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbDefects) {
        const { data: ships } = await supabase.from('ships').select('id,name');
        const shipMap = new Map((ships ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));
        setDefects(
          dbDefects.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            ship_id: d.ship_id as string,
            ship_name: shipMap.get(d.ship_id as string) ?? 'Unknown Vessel',
            inspection_id: d.inspection_id as string | null,
            inspection_item_id: d.inspection_item_id as string | null,
            title: d.title as string,
            severity: d.severity as 'low' | 'medium' | 'critical',
            assigned_officer: d.assigned_officer as string,
            target_resolution_date: d.target_resolution_date as string,
            status: d.status as 'open' | 'in_progress' | 'resolved',
            photo_label: (d.photo_label as string) ?? null,
            photo_compressed_size: (d.photo_compressed_size as string) ?? null,
            photo_original_size: (d.photo_original_size as string) ?? null,
            created_by_role: d.created_by_role as Role,
            created_by_name: d.created_by_name as string,
            gps_coordinates: (d.gps_coordinates as string) ?? '',
            checklist_ref: (d.checklist_ref as string) ?? null,
            created_at: d.created_at as string,
          })),
        );
      }

      const { data: dbAudit } = await supabase
        .from('audit_log_entries')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbAudit) {
        setAuditLog(
          dbAudit.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            inspection_id: (e.inspection_id as string) ?? null,
            ship_id: (e.ship_id as string) ?? null,
            action: e.action as string,
            action_type: e.action_type as string,
            user_name: e.user_name as string,
            user_role: e.user_role as Role,
            gps_coordinates: (e.gps_coordinates as string) ?? '',
            item_key: (e.item_key as string) ?? null,
            item_question: (e.item_question as string) ?? null,
            created_at: e.created_at as string,
          })),
        );
      }
    })();
  }, []);

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
    const tempId = `defect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const newDefect: Defect = { ...d, id: tempId, created_at: now };
    setDefects((prev) => [newDefect, ...prev]);

    (async () => {
      await supabase.from('defects').insert({
        ship_id: d.ship_id || null,
        inspection_id: d.inspection_id,
        inspection_item_id: d.inspection_item_id,
        title: d.title,
        severity: d.severity,
        assigned_officer: d.assigned_officer,
        target_resolution_date: d.target_resolution_date,
        status: d.status,
        photo_label: d.photo_label,
        photo_compressed_size: d.photo_compressed_size,
        photo_original_size: d.photo_original_size,
        created_by_role: d.created_by_role,
        created_by_name: d.created_by_name,
        gps_coordinates: d.gps_coordinates,
        checklist_ref: d.checklist_ref,
      });
    })();

    return newDefect;
  }, []);

  const updateDefect = useCallback((id: string, updates: Partial<Defect>) => {
    setDefects((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));

    (async () => {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.assigned_officer) dbUpdates.assigned_officer = updates.assigned_officer;
      if (updates.target_resolution_date) dbUpdates.target_resolution_date = updates.target_resolution_date;
      await supabase.from('defects').update(dbUpdates).eq('id', id);
    })();
  }, []);

  const addAuditEntry = useCallback((e: Omit<AuditLogEntry, 'id' | 'created_at'>) => {
    const tempId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: AuditLogEntry = { ...e, id: tempId, created_at: new Date().toISOString() };
    setAuditLog((prev) => [entry, ...prev]);

    (async () => {
      await supabase.from('audit_log_entries').insert({
        inspection_id: e.inspection_id,
        ship_id: e.ship_id,
        action: e.action,
        action_type: e.action_type,
        user_name: e.user_name,
        user_role: e.user_role,
        gps_coordinates: e.gps_coordinates,
        item_key: e.item_key,
        item_question: e.item_question,
      });
    })();
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
