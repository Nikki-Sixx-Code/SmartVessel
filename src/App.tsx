import { useState, useEffect, useCallback } from 'react';
import {
  Ship as ShipIcon,
  ClipboardCheck,
  Anchor,
  FileCheck2,
  Brain,
  Layers,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  RefreshCw,
  Loader2,
  CloudUpload,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import ShipDashboard from '@/screens/ShipDashboard';
import InspectionForm from '@/screens/InspectionForm';
import FleetDashboard from '@/screens/FleetDashboard';
import ComplianceChecklists from '@/screens/ComplianceChecklists';
import PortIntelligenceMatrix from '@/screens/PortIntelligenceMatrix';
import FleetManagement from '@/screens/FleetManagement';
import { AppProvider, useApp } from '@/lib/appState';

type Screen = 'ship' | 'inspection' | 'fleet' | 'compliance' | 'intel' | 'fleetmgmt';

const NAV: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: 'ship', label: 'Vessel Dashboard', icon: <ShipIcon className="h-5 w-5" /> },
  { id: 'fleetmgmt', label: 'Fleet Management', icon: <Layers className="h-5 w-5" /> },
  { id: 'compliance', label: 'Compliance Checklists', icon: <FileCheck2 className="h-5 w-5" /> },
  { id: 'inspection', label: 'Engine Room Inspection', icon: <ClipboardCheck className="h-5 w-5" /> },
  { id: 'intel', label: 'Port Intelligence', icon: <Brain className="h-5 w-5" /> },
  { id: 'fleet', label: 'Fleet Office', icon: <Anchor className="h-5 w-5" /> },
];

function useTimeAgo(lastSyncTime: number | null): string {
  const [, tick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => tick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!lastSyncTime) return '';
  const mins = Math.floor((Date.now() - lastSyncTime) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>('ship');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { networkStatus, pendingSyncCount, nightMode, isSyncing, lastSyncTime, setNetworkStatus, clearPendingSync, toggleNightMode, setSyncing, setLastSyncTime } = useApp();
  const syncAgo = useTimeAgo(lastSyncTime);

  const handleSignalRestore = useCallback(() => {
    if (pendingSyncCount === 0 || isSyncing) return;
    setNetworkStatus('online');
    setSyncing(true);
    setTimeout(() => {
      clearPendingSync();
      setSyncing(false);
      setLastSyncTime(Date.now());
    }, 2000);
  }, [pendingSyncCount, isSyncing, setNetworkStatus, setSyncing, clearPendingSync, setLastSyncTime]);

  const navigate = (s: Screen) => {
    setScreen(s);
    setDrawerOpen(false);
  };

  // Night mode theme classes
  const night = nightMode;
  const rootBg = night ? 'bg-black text-red-200' : 'bg-slate-950 text-slate-100';
  const sidebarBg = night ? 'bg-black border-red-900/50' : 'bg-slate-950 border-slate-800';
  const headerBg = night ? 'bg-black/95 border-red-900/40' : 'bg-slate-950/95 border-slate-800';
  const navItemBase = night ? 'text-red-300 hover:bg-red-950/50' : 'text-slate-400 hover:bg-slate-800';
  const navItemActive = night ? 'bg-red-800 text-white' : 'bg-blue-600 text-white';
  const brandColor = night ? 'text-red-400' : 'text-blue-400';
  const drawerOverlay = night ? 'bg-black/80' : 'bg-black/70';

  // Sync badge
  const syncBadge = isSyncing
    ? { bg: 'bg-blue-500/15', text: 'text-blue-300', ring: 'ring-blue-500/30', dot: 'bg-blue-400', label: 'Syncing…' }
    : networkStatus === 'online' && pendingSyncCount === 0
    ? { bg: 'bg-emerald-500/15', text: 'text-emerald-300', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400', label: `Online${syncAgo ? ` — Synced ${syncAgo}` : ''}` }
    : pendingSyncCount > 0
    ? { bg: 'bg-amber-500/15', text: 'text-amber-300', ring: 'ring-amber-500/30', dot: 'bg-amber-400', label: `Offline — ${pendingSyncCount} pending sync${pendingSyncCount > 1 ? 's' : ''}` }
    : { bg: 'bg-emerald-500/15', text: 'text-emerald-300', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400', label: 'Online — Synced' };

  return (
    <div className={`min-h-screen ${rootBg} transition-colors duration-300`}>
      {/* Top Header — permanent, all viewports */}
      <header className={`sticky top-0 z-40 border-b ${headerBg} backdrop-blur`}>
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 lg:px-6">
          {/* Hamburger — mobile/tablet only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition lg:hidden ${navItemBase}`}
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-6 w-6 ${brandColor}`} />
            <span className="text-sm font-bold sm:text-base">SmartVessel</span>
            <span className="hidden text-xs text-slate-500 sm:inline">Compliance</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sync Status Badge — permanent */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ring-1 ${syncBadge.bg} ${syncBadge.text} ${syncBadge.ring}`}>
            <span className={`h-2 w-2 rounded-full ${syncBadge.dot} ${isSyncing ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{syncBadge.label}</span>
            <span className="sm:hidden">{isSyncing ? 'Sync' : networkStatus === 'online' && pendingSyncCount === 0 ? 'Synced' : `${pendingSyncCount}P`}</span>
          </span>

          {/* Signal Restored button — compact */}
          {pendingSyncCount > 0 && !isSyncing && (
            <button
              onClick={handleSignalRestore}
              className="ml-1 flex h-11 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95"
              title="Simulate signal restored and sync to shore database"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Signal Restored</span>
            </button>
          )}
          {isSyncing && (
            <span className="ml-1 flex h-11 items-center gap-1.5 rounded-lg bg-slate-700 px-3 text-xs font-bold text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Syncing…</span>
            </span>
          )}

          {/* Night Mode Toggle */}
          <button
            onClick={toggleNightMode}
            className={`ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 transition active:scale-95 ${
              night
                ? 'border-red-500 bg-red-900/40 text-red-300'
                : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={night ? 'Night Mode (Red Light) — Tap to disable' : 'Enable Night Mode (Red Light) for bridge watchkeeping'}
          >
            {night ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside className={`fixed left-0 top-[57px] z-30 hidden h-[calc(100vh-57px)] w-64 border-r ${sidebarBg} lg:block`}>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                screen === n.id ? `${navItemActive} shadow-lg` : navItemBase
              }`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Offline-First · Ultra-Low Bandwidth
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div className={`absolute inset-0 ${drawerOverlay} backdrop-blur-sm`} onClick={() => setDrawerOpen(false)} />

          {/* Drawer panel */}
          <div className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r ${sidebarBg} shadow-2xl`}>
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-800/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`h-6 w-6 ${brandColor}`} />
                <span className="text-sm font-bold">SmartVessel Compliance</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${navItemBase}`}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-1 p-3">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate(n.id)}
                  className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    screen === n.id ? `${navItemActive} shadow-lg` : navItemBase
                  }`}
                >
                  {n.icon}
                  {n.label}
                </button>
              ))}
            </nav>

            {/* Sync status in drawer */}
            <div className="absolute bottom-0 left-0 right-0 space-y-2 border-t border-slate-800/50 p-4">
              <div className={`flex items-center gap-2 rounded-lg ${syncBadge.bg} px-3 py-2 text-xs font-bold ${syncBadge.text}`}>
                <span className={`h-2 w-2 rounded-full ${syncBadge.dot} ${isSyncing ? 'animate-pulse' : ''}`} />
                {syncBadge.label}
              </div>
              {pendingSyncCount > 0 && !isSyncing && (
                <button
                  onClick={handleSignalRestore}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95"
                >
                  <RefreshCw className="h-4 w-4" /> Sync Now (Signal Restored)
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CloudUpload className="h-4 w-4" />
                Offline-First · Ultra-Low Bandwidth
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content — offset for sidebar on desktop */}
      <main className="lg:ml-64">
        {screen === 'ship' && <ShipDashboard onOpenInspection={() => setScreen('inspection')} />}
        {screen === 'fleetmgmt' && <FleetManagement />}
        {screen === 'compliance' && <ComplianceChecklists />}
        {screen === 'inspection' && <InspectionForm onBack={() => setScreen('ship')} />}
        {screen === 'intel' && <PortIntelligenceMatrix />}
        {screen === 'fleet' && <FleetDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
