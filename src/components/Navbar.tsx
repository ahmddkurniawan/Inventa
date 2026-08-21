import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Sparkles,
  AlertTriangle,
  X,
  Plus,
  Menu,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { formatNumber } from '../services/storageService';

interface NavbarProps {
  items?: InventoryItem[];
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenQuickMutation: (type: 'IN' | 'OUT', item?: InventoryItem) => void;
  onOpenProductModal: () => void;
  onSelectProduct?: (item: InventoryItem) => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  items = [],
  selectedLocation,
  onSelectLocation,
  searchQuery,
  onSearchChange,
  onOpenQuickMutation,
  onOpenProductModal,
  onSelectProduct,
  onToggleMobileSidebar,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const safeItems = items || [];
  const criticalItems = safeItems.filter(
    (it) => it.status === 'critical' || it.status === 'out_of_stock' || it.status === 'low_stock'
  );

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-3 transition-all">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Brand & Live Indicator */}
          <div className="flex items-center gap-3">
            {onToggleMobileSidebar && (
              <button
                id="mobile-sidebar-toggle-btn"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Menu Navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                    INVENTA
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden sm:flex">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Sistem Manajemen Inventaris & Pelacakan Stok
                </p>
              </div>
            </div>
          </div>

          {/* Center: Search & Location Switcher (Desktop) */}
          <div className="flex-1 max-w-xl hidden md:flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="navbar-search-input"
                type="text"
                placeholder="Cari SKU, Nama Barang, Kategori, atau Barcode..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              id="navbar-location-select"
              value={selectedLocation}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="text-xs font-medium bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-colors"
            >
              <option value="ALL">🏢 Semua Lokasi Gudang</option>
              <option value="Gudang Makassar">📍 Gudang Makassar</option>
            </select>
          </div>

          {/* Right: Real-time Actions & Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Clock */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200/70 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime || 'Syncing...'}</span>
          </div>

          {/* Quick Stock Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="navbar-stock-in-btn"
              onClick={() => onOpenQuickMutation('IN')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70 transition-colors shadow-xs"
              title="Catat Barang Masuk (Purchase / Receipt)"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Stok Masuk</span>
            </button>

            <button
              id="navbar-stock-out-btn"
              onClick={() => onOpenQuickMutation('OUT')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/70 transition-colors shadow-xs"
              title="Catat Barang Keluar (Sales / Dispatch)"
            >
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Stok Keluar</span>
            </button>

            <button
              id="navbar-add-product-btn"
              onClick={onOpenProductModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
              title="Tambah Master Barang Baru"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Item</span>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="navbar-notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifikasi & Peringatan Stok"
            >
              <Bell className="w-5 h-5" />
              {criticalItems.length > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {criticalItems.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                id="notifications-popup"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-sm text-slate-800">
                      Peringatan Stok ({criticalItems.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Tutup
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
                  {criticalItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      ✨ Semua stok berada pada level aman!
                    </div>
                  ) : (
                    criticalItems.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 px-1 hover:bg-slate-50 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(item);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                item.status === 'out_of_stock'
                                  ? 'bg-red-100 text-red-700'
                                  : item.status === 'critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {item.status === 'out_of_stock'
                                ? 'HABIS'
                                : item.status === 'critical'
                                ? 'KRITIS'
                                : 'MENIPIS'}
                            </span>
                            <span className="font-mono text-xs text-slate-500 truncate">
                              {item.sku}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Sisa: <strong className="text-slate-800">{formatNumber(item.currentStock)}</strong> {item.unit} (Min: {item.minStock})
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuickMutation('IN', item);
                            setShowNotifications(false);
                          }}
                          className="shrink-0 text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
                        >
                          + Restock
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Pantau terus stok minimum</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (Only visible on mobile) */}
      <div className="md:hidden mt-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SKU, Barang..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-sm bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      </div>
    </header>
  );
};
