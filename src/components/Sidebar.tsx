import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ActiveTab, InventoryItem } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  items?: InventoryItem[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  items = [],
  isOpenMobile,
  onCloseMobile,
}) => {
  const safeItems = items || [];
  const lowStockCount = safeItems.filter(
    (i) => i.status === 'low_stock' || i.status === 'critical' || i.status === 'out_of_stock'
  ).length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Analitik',
      icon: LayoutDashboard,
      desc: 'KPI, Tren & Statistik',
    },
    {
      id: 'realtime' as ActiveTab,
      label: 'Pelacakan Stok Real-Time',
      icon: Activity,
      desc: 'Live Monitor & Quick In/Out',
      badge: lowStockCount > 0 ? `${lowStockCount} Alert` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'products' as ActiveTab,
      label: 'Master Data Barang',
      icon: Package,
      desc: 'Kelola SKU & Detail Produk',
      badge: `${safeItems.length} Item`,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
    {
      id: 'movements' as ActiveTab,
      label: 'Riwayat Mutasi Stok',
      icon: ArrowLeftRight,
      desc: 'Log Keluar, Masuk & Opname',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Laporan Otomatis Bulanan',
      icon: FileSpreadsheet,
      desc: 'Valuasi, AI Review & Export',
      isAi: true,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: 'Vendor & Supplier',
      icon: Users,
      desc: 'Direktori Pemasok',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64 lg:w-72 border-r border-slate-800">
      {/* Top Header inside sidebar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">PANEL ADMIN</div>
            <div className="text-[11px] text-slate-400">Inventory Engine v2.4</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => {
                onTabChange(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate">{item.label}</span>
                    {item.isAi && (
                      <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-orange-400 text-[9px] font-black text-slate-950 rounded flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] block truncate ${
                      isActive ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    {item.desc}
                  </span>
                </div>
              </div>

              {item.badge ? (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              ) : (
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Storage Health & User Badge */}
      <div className="p-3 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Koneksi & Sinkronisasi</span>
        </div>
        <div className="text-[11px] text-slate-400 mb-2">
          Penyimpanan otomatis aktif di browser dengan audit trail mutasi real-time.
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[95%] rounded-full" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>In-Memory Sync</span>
          <span className="text-emerald-400 font-semibold">100% Siap</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
