import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  QrCode,
  Download,
  Upload,
  AlertTriangle,
  Building2,
  DollarSign,
  Tag,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { formatNumber, formatRupiah } from '../services/storageService';

interface ProductManagementViewProps {
  items?: InventoryItem[];
  onAddProduct: () => void;
  onEditProduct: (item: InventoryItem) => void;
  onDeleteProduct: (id: string) => void;
  onViewBarcode: (item: InventoryItem) => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  items = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onViewBarcode,
  onExportCSV,
  onImportCSV,
}) => {
  const safeItems = items || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = Array.from(new Set(safeItems.map((i) => i.category)));

  const filteredItems = safeItems.filter((it) => {
    const matchesSearch =
      (it.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (it.sku || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (it.barcode || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || it.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Master Data Produk & Inventaris
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola katalog SKU, informasi supplier, penetapan harga beli/jual, dan batas minimum restock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Impor CSV</span>
            <input type="file" accept=".csv" onChange={onImportCSV} className="hidden" />
          </label>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Master</span>
          </button>

          <button
            onClick={onAddProduct}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SKU, Nama Barang, Barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Products Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Info Produk & SKU</th>
                <th className="py-3 px-4">Kategori & Satuan</th>
                <th className="py-3 px-4 text-right">Harga Beli (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">Margin</th>
                <th className="py-3 px-4 text-center">Stok Min / Max</th>
                <th className="py-3 px-4">Lokasi & Supplier</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Tidak ada produk yang sesuai dengan kriteria pencarian
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const marginPercent =
                    item.costPrice > 0
                      ? Math.round(((item.sellingPrice - item.costPrice) / item.costPrice) * 100)
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => onViewBarcode(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors shrink-0"
                            title="Tampilkan Barcode Label"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                                {item.sku}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                Barcode: {item.barcode}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{item.category}</div>
                        <div className="text-[10px] text-slate-500">Satuan: {item.unit}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                        {formatRupiah(item.costPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(item.sellingPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-block font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{marginPercent}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-xs whitespace-nowrap">
                        <span className="text-rose-600 font-bold">{item.minStock}</span> /{' '}
                        <span className="text-slate-600">{item.maxStock}</span> {item.unit}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <div className="font-medium text-slate-800 truncate max-w-[170px]">
                          {item.location}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                          {item.supplierName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditProduct(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus produk "${item.name}"?`)) {
                                onDeleteProduct(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-colors"
                            title="Hapus Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
