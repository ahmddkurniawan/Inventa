import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Sparkles,
  Building2,
  DollarSign,
  Tag,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { InventoryItem, Supplier, WarehouseLocation } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: InventoryItem | null;
  suppliers: Supplier[];
  locations: WarehouseLocation[];
  onSave: (item: Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'>, id?: string) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  suppliers,
  locations,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category: '',
    unit: 'Unit',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minStock: 10,
    maxStock: 100,
    location: locations[0]?.name || 'Gudang Makassar - Rak A1',
    supplierId: suppliers[0]?.id || 'SUP-01',
    supplierName: suppliers[0]?.name || 'PT Tera Computindo Nusantara',
    batchNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        unit: product.unit,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        currentStock: product.currentStock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        location: product.location,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        batchNumber: product.batchNumber || '',
        notes: product.notes || '',
      });
    } else {
      // Auto-generate SKU
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const autoSku = `ITM-${randomDigits}`;
      const autoBarcode = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
      setFormData({
        sku: autoSku,
        barcode: autoBarcode,
        name: '',
        category: '',
        unit: 'Pcs',
        costPrice: 100000,
        sellingPrice: 145000,
        currentStock: 10,
        minStock: 5,
        maxStock: 50,
        location: locations[0]?.name ? `${locations[0].name} - Rak 01` : 'Gudang Makassar - Rak A1',
        supplierId: suppliers[0]?.id || 'SUP-01',
        supplierName: suppliers[0]?.name || 'PT Tera Computindo Nusantara',
        batchNumber: `BT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
        notes: '',
      });
    }
  }, [product, isOpen, suppliers, locations]);

  if (!isOpen) return null;

  const handleSupplierChange = (supId: string) => {
    const selected = suppliers.find((s) => s.id === supId);
    setFormData((prev) => ({
      ...prev,
      supplierId: supId,
      supplierName: selected ? selected.name : prev.supplierName,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    onSave(
      {
        ...formData,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
      },
      product ? product.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {product ? 'Edit Data Master Barang' : 'Tambah Master Barang Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi spesifikasi SKU, harga HPP, dan ambang batas stok minimum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kode SKU Barang *
              </label>
              <input
                type="text"
                required
                placeholder="misal: ELC-LAP-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Barcode / EAN-13
              </label>
              <input
                type="text"
                placeholder="899123456789"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap Produk *
            </label>
            <input
              type="text"
              required
              placeholder="misal: Laptop Bisnis Core i5 16GB 512GB SSD"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <input
                type="text"
                list="product-categories"
                placeholder="misal: Elektronik, Pakaian, dll"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Unit">Unit</option>
                <option value="Box">Box</option>
                <option value="Pack">Pack</option>
                <option value="Roll">Roll</option>
                <option value="Kg">Kg (Kilogram)</option>
                <option value="Rim">Rim</option>
                <option value="Set">Set</option>
              </select>
            </div>
          </div>

          {/* Pricing: Cost vs Selling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Harga Pokok Pembelian (HPP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Harga Jual Rekomendasi
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Stock Quantities: Current, Min, Max */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Stok Saat Ini
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Stok Minimum (Alert) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kapasitas Max Rak
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lokasi Rak / Gudang
              </label>
              <input
                type="text"
                placeholder="Gudang Makassar - Rak A1"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supplier Utama
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Batch / Lot
              </label>
              <input
                type="text"
                placeholder="BT-202608-01"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan / Deskripsi Tambahan
              </label>
              <input
                type="text"
                placeholder="Kondisi penyimpanan, garansi..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
            >
              {product ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
