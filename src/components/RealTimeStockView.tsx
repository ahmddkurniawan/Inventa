import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  QrCode,
  Edit,
  Building2,
  RefreshCw,
  PackagePlus,
  TrendingDown,
  Info,
} from 'lucide-react';
import { InventoryItem, ItemStatus } from '../types';
import { formatNumber, formatRupiah } from '../services/storageService';

interface RealTimeStockViewProps {
  items?: InventoryItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  onOpenQuickMutation: (type: 'IN' | 'OUT' | 'ADJUSTMENT', item?: InventoryItem) => void;
  onEditProduct: (item: InventoryItem) => void;
  onViewBarcode: (item: InventoryItem) => void;
  onOpenAddProduct: () => void;
}

export const RealTimeStockView: React.FC<RealTimeStockViewProps> = ({
  items = [],
  searchQuery,
  onSearchChange,
  selectedLocation,
  onSelectLocation,
  onOpenQuickMutation,
  onEditProduct,
  onViewBarcode,
  onOpenAddProduct,
}) => {
  const safeItems = items || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Extract available categories
  const categories = Array.from(new Set(safeItems.map((i) => i.category)));

  // Filter items
  const filteredItems = safeItems.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item.sku || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item.barcode || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item.category || '').toLowerCase().includes((searchQuery || '').toLowerCase());

    const matchesLocation =
      selectedLocation === 'ALL' || (item.location || '').includes(selectedLocation);

    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'critical' && (item.status === 'critical' || item.status === 'out_of_stock')) ||
      (selectedStatus === 'low_stock' && item.status === 'low_stock') ||
      (selectedStatus === 'in_stock' && item.status === 'in_stock') ||
      (selectedStatus === 'out_of_stock' && item.status === 'out_of_stock');

    return matchesSearch && matchesLocation && matchesCategory && matchesStatus;
  });

  const countByStatus = {
    all: safeItems.length,
    in_stock: safeItems.filter((i) => i.status === 'in_stock').length,
    low_stock: safeItems.filter((i) => i.status === 'low_stock').length,
    critical: safeItems.filter((i) => i.status === 'critical').length,
    out_of_stock: safeItems.filter((i) => i.status === 'out_of_stock').length,
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Aman
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Menipis
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Kritis
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-900 border border-red-300">
            <XCircle className="w-3 h-3 text-red-700" />
            Habis
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Pelacakan Stok Real-Time
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold font-mono">
              {filteredItems.length} Produk Ditampilkan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data terupdate secara langsung setiap kali terjadi mutasi barang masuk, keluar, atau opname.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <PackagePlus className="w-4 h-4" />
            + Tambah Barang Baru
          </button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedStatus('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            selectedStatus === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semua ({countByStatus.all})
        </button>
        <button
          onClick={() => setSelectedStatus('in_stock')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            selectedStatus === 'in_stock'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Aman ({countByStatus.in_stock})
        </button>
        <button
          onClick={() => setSelectedStatus('low_stock')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            selectedStatus === 'low_stock'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Menipis ({countByStatus.low_stock})
        </button>
        <button
          onClick={() => setSelectedStatus('critical')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            selectedStatus === 'critical'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Kritis ({countByStatus.critical})
        </button>
        <button
          onClick={() => setSelectedStatus('out_of_stock')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            selectedStatus === 'out_of_stock'
              ? 'bg-red-700 text-white'
              : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-600" />
          Habis ({countByStatus.out_of_stock})
        </button>
      </div>

      {/* Filter Row: Category & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SKU, Nama Barang, Barcode..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">📦 Semua Kategori ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Real-time Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Lokasi Rak / Gudang</th>
                <th className="py-3 px-4">Level Stok Fisik</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Harga Beli / HPP</th>
                <th className="py-3 px-4 text-right">Total Valuasi</th>
                <th className="py-3 px-4 text-center">Aksi Cepat Mutasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">Tidak ada barang yang cocok dengan filter</p>
                    <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const percentage = Math.min(
                    100,
                    Math.round((item.currentStock / item.maxStock) * 100)
                  );
                  const isStockCritical = item.currentStock <= item.minStock;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        item.status === 'out_of_stock'
                          ? 'bg-red-50/30'
                          : item.status === 'critical'
                          ? 'bg-rose-50/20'
                          : ''
                      }`}
                    >
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => onViewBarcode(item)}
                            className="shrink-0 p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                            title="Lihat Barcode / Label QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-semibold">
                                {item.sku}
                              </span>
                              {item.batchNumber && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  Lot: {item.batchNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium whitespace-nowrap">
                          {item.category}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{item.location}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          Supplier: {item.supplierName}
                        </div>
                      </td>

                      {/* Stock Level with visual bar */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-baseline justify-between mb-1 text-xs">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatNumber(item.currentStock)}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              {item.unit}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Min: {item.minStock} / Max: {item.maxStock}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.status === 'out_of_stock'
                                ? 'bg-red-600'
                                : item.status === 'critical'
                                ? 'bg-rose-500'
                                : item.status === 'low_stock'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(percentage, 4)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                        {formatRupiah(item.costPrice)}
                      </td>

                      {/* Total Valuation */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(item.currentStock * item.costPrice)}
                      </td>

                      {/* Quick Mutation Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`stock-in-item-${item.id}`}
                            onClick={() => onOpenQuickMutation('IN', item)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Tambah Stok Masuk (+)"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>
                          <button
                            id={`stock-out-item-${item.id}`}
                            onClick={() => onOpenQuickMutation('OUT', item)}
                            disabled={item.currentStock <= 0}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Kurangi Stok Keluar (-)"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenQuickMutation('ADJUSTMENT', item)}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                            title="Stock Opname / Penyesuaian"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditProduct(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit Data Produk"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
