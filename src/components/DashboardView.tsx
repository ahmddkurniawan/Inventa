import React from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { InventoryItem, StockMovement, ActiveTab, WarehouseLocation } from '../types';
import { formatNumber, formatRupiah } from '../services/storageService';

interface DashboardViewProps {
  items?: InventoryItem[];
  movements?: StockMovement[];
  locations?: WarehouseLocation[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenQuickMutation: (type: 'IN' | 'OUT', item?: InventoryItem) => void;
  onOpenScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items = [],
  movements = [],
  locations = [],
  onNavigateTab,
  onOpenQuickMutation,
  onOpenScanner,
}) => {
  const safeItems = items || [];
  const safeMovements = movements || [];
  const safeLocations = locations || [];

  // Calculations
  const totalValuation = safeItems.reduce((acc, it) => acc + (it.currentStock || 0) * (it.costPrice || 0), 0);
  const totalPhysicalUnits = safeItems.reduce((acc, it) => acc + (it.currentStock || 0), 0);
  const outOfStockItems = safeItems.filter((it) => it.status === 'out_of_stock');
  const criticalItems = safeItems.filter((it) => it.status === 'critical' || it.status === 'low_stock');

  // Month movements
  const now = new Date();
  const currentMonthMovements = safeMovements.filter((m) => {
    const d = new Date(m.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalInMonth = currentMonthMovements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalOutMonth = currentMonthMovements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalInValue = currentMonthMovements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + m.totalCost, 0);

  const totalOutValue = currentMonthMovements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + m.totalCost, 0);

  // Category Distribution for Pie Chart
  const categoryMap = new Map<string, { count: number; value: number }>();
  safeItems.forEach((it) => {
    const cur = categoryMap.get(it.category) || { count: 0, value: 0 };
    categoryMap.set(it.category, {
      count: cur.count + it.currentStock,
      value: cur.value + it.currentStock * it.costPrice,
    });
  });

  const categoryChartData = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    value: data.value,
    count: data.count,
  }));

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6'];

  // Top 5 Fast Moving items for Bar Chart
  const topFastMoving = [...items]
    .map((it) => ({
      name: it.name.length > 18 ? it.name.slice(0, 18) + '...' : it.name,
      sold: it.totalSoldThisMonth || 0,
      stock: it.currentStock,
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Movement activity trend (Mock daily distribution based on recent transactions)
  const movementTrendData = [
    { day: 'Sen', masuk: 15, keluar: 22 },
    { day: 'Sel', masuk: 30, keluar: 18 },
    { day: 'Rab', masuk: 10, keluar: 35 },
    { day: 'Kam', masuk: 45, keluar: 28 },
    { day: 'Jum', masuk: 20, keluar: 40 },
    { day: 'Sab', masuk: 5, keluar: 15 },
    { day: 'Min', masuk: 0, keluar: 8 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Dashboard Analitik Real-Time
            </span>
            <span className="text-xs text-slate-400">Periode: Agustus 2026</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Pusat Kendali & Kesehatan Inventaris
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Pantau pergerakan stok real-time, estimasi valuasi aset, mutasi harian, dan peringatan stok kritis otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="dash-quick-in-btn"
            onClick={() => onOpenQuickMutation('IN')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-950/40 transition-transform active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4" />
            + Barang Masuk
          </button>
          <button
            id="dash-quick-out-btn"
            onClick={() => onOpenQuickMutation('OUT')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-950/40 transition-transform active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            - Barang Keluar
          </button>
          <button
            id="dash-scan-btn"
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all backdrop-blur-sm"
          >
            <QrCode className="w-4 h-4" />
            Scan Barcode
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Valuasi Aset
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(totalValuation)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>HPP (Harga Pokok Pembelian) Aktif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total SKUs and Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Unit Fisik
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatNumber(totalPhysicalUnits)}{' '}
              <span className="text-sm font-semibold text-slate-500">Unit</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Tersebar di {items.length} SKU Aktif</span>
            </div>
          </div>
        </div>

        {/* Card 3: Critical & Low Stock */}
        <div
          onClick={() => onNavigateTab('realtime')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Perlu Restock Segera
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                outOfStockItems.length + criticalItems.length > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{outOfStockItems.length + criticalItems.length}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {outOfStockItems.length} Habis
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-indigo-600 font-semibold group-hover:underline">
              <span>Lihat daftar item kritis</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Turnover Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mutasi Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-emerald-700 font-medium block">Masuk (+)</span>
              <strong className="text-emerald-900 text-sm font-bold block">
                {formatNumber(totalInMonth)} Unit
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
              <span className="text-amber-700 font-medium block">Keluar (-)</span>
              <strong className="text-amber-900 text-sm font-bold block">
                {formatNumber(totalOutMonth)} Unit
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mutasi Trend & Top Fast Moving */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Daily Movement Flow */}
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Tren Pergerakan Stok Mingguan
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan kuantitas barang masuk (pembelian) vs barang keluar (penjualan)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded bg-emerald-500" /> Masuk
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-3 h-3 rounded bg-amber-500" /> Keluar
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="masuk" fill="#10B981" radius={[4, 4, 0, 0]} name="Barang Masuk (Unit)" />
                  <Bar dataKey="keluar" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Barang Keluar (Unit)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Top 5 Fast-Moving Items */}
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Top 5 Item Terlaris (Fast-Moving)
                </h3>
                <p className="text-xs text-slate-500">
                  Produk dengan volume pengeluaran tertinggi bulan ini
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Lihat Laporan Bulanan
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topFastMoving}
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={100} />
                  <Tooltip
                    formatter={(val) => [`${val} Unit Terjual`, 'Volume']}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="sold" fill="#6366F1" radius={[0, 6, 6, 0]} name="Terjual (Unit)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Distribution & Warehouse Capacity */}
        <div className="space-y-6">
          {/* Category Distribution Pie Chart */}
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="mb-3">
              <h3 className="font-bold text-base text-slate-900">Valuasi per Kategori</h3>
              <p className="text-xs text-slate-500">Porsi modal aset inventaris</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatRupiah(Number(value)), 'Valuasi']}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 max-h-36 overflow-y-auto">
              {categoryChartData.map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium truncate">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 shrink-0 font-mono">
                    {formatRupiah(cat.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warehouse Space Utilization */}
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Kapasitas Gudang</h3>
                <p className="text-xs text-slate-500">Utilisasi ruang penyimpanan</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                3 Lokasi
              </span>
            </div>

            <div className="space-y-4">
              {locations.map((loc) => {
                const percentage = Math.min(100, Math.round((loc.currentUsage / loc.maxCapacity) * 100));
                return (
                  <div key={loc.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate">{loc.name}</span>
                      <span className="font-mono font-bold text-slate-700">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage > 85
                            ? 'bg-rose-500'
                            : percentage > 70
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>PIC: {loc.manager}</span>
                      <span>
                        {formatNumber(loc.currentUsage)} / {formatNumber(loc.maxCapacity)} Unit
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Movements Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Log Mutasi Stok Terakhir
            </h3>
            <p className="text-xs text-slate-500">
              Catatan transaksi masuk, keluar, dan penyesuaian terbaru
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('movements')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Lihat Semua Transaksi
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">No. Referensi</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Nama Produk & SKU</th>
                <th className="py-3 px-4 text-right">Kuantitas</th>
                <th className="py-3 px-4">Stok Akhir</th>
                <th className="py-3 px-4">Petugas / Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.slice(0, 5).map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(mov.timestamp).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    {mov.referenceNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mov.type === 'IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.type === 'OUT'
                          ? 'bg-amber-100 text-amber-800'
                          : mov.type === 'ADJUSTMENT'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {mov.type === 'IN' ? 'MASUK' : mov.type === 'OUT' ? 'KELUAR' : mov.type === 'ADJUSTMENT' ? 'OPNAME' : 'TRANSFER'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 truncate max-w-xs">{mov.itemName}</div>
                    <div className="font-mono text-[10px] text-slate-400">{mov.itemSku}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    <span
                      className={
                        mov.type === 'IN'
                          ? 'text-emerald-600'
                          : mov.type === 'OUT'
                          ? 'text-amber-600'
                          : 'text-purple-600'
                      }
                    >
                      {mov.type === 'IN' ? '+' : mov.type === 'OUT' ? '-' : ''}
                      {formatNumber(mov.quantity)} {mov.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatNumber(mov.newStock)} {mov.unit}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{mov.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
