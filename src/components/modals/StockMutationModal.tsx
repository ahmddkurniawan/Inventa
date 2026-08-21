import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  FileText,
} from 'lucide-react';
import { InventoryItem, MovementType, WarehouseLocation } from '../../types';
import {
  formatNumber,
  formatRupiah,
  generateReferenceNumber,
} from '../../services/storageService';

interface StockMutationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  locations: WarehouseLocation[];
  initialType?: MovementType;
  initialItem?: InventoryItem;
  onSubmit: (data: {
    itemId: string;
    type: MovementType;
    quantity: number;
    operator: string;
    notes: string;
    referenceNumber: string;
    supplierOrRecipient: string;
    destinationLocation?: string;
  }) => void;
}

export const StockMutationModal: React.FC<StockMutationModalProps> = ({
  isOpen,
  onClose,
  items,
  locations,
  initialType = 'IN',
  initialItem,
  onSubmit,
}) => {
  const [type, setType] = useState<MovementType>(initialType);
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItem?.id || items[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [operator, setOperator] = useState<string>('Admin Gudang');
  const [supplierOrRecipient, setSupplierOrRecipient] = useState<string>('');
  const [destinationLocation, setDestinationLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');

  useEffect(() => {
    if (initialType) setType(initialType);
    if (initialItem) {
      setSelectedItemId(initialItem.id);
      setSupplierOrRecipient(
        initialType === 'IN' ? initialItem.supplierName : 'Customer / Toko Retail'
      );
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [initialType, initialItem, items]);

  useEffect(() => {
    if (isOpen) {
      setReferenceNumber(generateReferenceNumber(type));
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId) || items[0];

  // Stock calculation preview
  const prevStock = currentItem ? currentItem.currentStock : 0;
  let nextStock = prevStock;

  if (type === 'IN') {
    nextStock = prevStock + Number(quantity || 0);
  } else if (type === 'OUT') {
    nextStock = Math.max(0, prevStock - Number(quantity || 0));
  } else if (type === 'ADJUSTMENT') {
    nextStock = Number(quantity || 0); // Directly set to actual count
  }

  const isInvalidOut = type === 'OUT' && Number(quantity || 0) > prevStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || quantity <= 0) return;
    if (isInvalidOut) return;

    let deltaQty = Number(quantity);
    if (type === 'ADJUSTMENT') {
      deltaQty = Number(quantity) - prevStock; // Calculate delta for adjustment
    }

    onSubmit({
      itemId: currentItem.id,
      type,
      quantity: deltaQty,
      operator: operator || 'Petugas Gudang',
      notes: notes || `Mutasi ${type} otomatis`,
      referenceNumber,
      supplierOrRecipient: supplierOrRecipient || (type === 'IN' ? currentItem.supplierName : 'Distribusi'),
      destinationLocation: type === 'TRANSFER' ? destinationLocation : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl text-white ${
                type === 'IN'
                  ? 'bg-emerald-600'
                  : type === 'OUT'
                  ? 'bg-amber-600'
                  : type === 'ADJUSTMENT'
                  ? 'bg-purple-600'
                  : 'bg-blue-600'
              }`}
            >
              {type === 'IN' ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : type === 'OUT' ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : type === 'ADJUSTMENT' ? (
                <SlidersHorizontal className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Formulir Transaksi Mutasi Stok
              </h3>
              <p className="text-xs text-slate-500">
                Catat pergerakan fisik barang ke dalam buku besar inventaris
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

        {/* Mutation Type Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('IN')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'IN'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Masuk (IN)
          </button>
          <button
            type="button"
            onClick={() => setType('OUT')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'OUT'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            - Keluar (OUT)
          </button>
          <button
            type="button"
            onClick={() => setType('ADJUSTMENT')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'ADJUSTMENT'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Opname
          </button>
          <button
            type="button"
            onClick={() => setType('TRANSFER')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'TRANSFER'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Reference & Item Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Referensi (Otomatis)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Petugas / Operator
              </label>
              <input
                type="text"
                required
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Select Product Item */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Barang / SKU *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.sku}] {item.name} — Stok Saat Ini: {item.currentStock} {item.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Stock Level Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                {type === 'ADJUSTMENT' ? 'Jumlah Fisik Sebenarnya (Hasil Opname):' : 'Jumlah Kuantitas:'}
              </span>
              <span className="font-mono text-slate-500">
                Satuan: <strong>{currentItem?.unit}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Estimasi Nilai Mutasi:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatRupiah((quantity || 0) * (currentItem?.costPrice || 0))}
                </span>
              </div>
            </div>

            {/* Calculated Stock Bar */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">
                Stok Awal: <strong>{prevStock}</strong>
              </span>
              <span className="text-slate-400">&rarr;</span>
              <span
                className={`font-bold ${
                  isInvalidOut
                    ? 'text-rose-600'
                    : 'text-emerald-700'
                }`}
              >
                Stok Baru: {nextStock} {currentItem?.unit}
              </span>
            </div>

            {isInvalidOut && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Kuantitas keluar melebihi stok yang tersedia ({prevStock} {currentItem?.unit})!</span>
              </div>
            )}
          </div>

          {/* Supplier or Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {type === 'IN'
                  ? 'Pemasok / Vendor Asal'
                  : type === 'OUT'
                  ? 'Nama Pelanggan / Tujuan'
                  : 'Keterangan Pihak Terkait'}
              </label>
              <input
                type="text"
                placeholder={type === 'IN' ? 'Nama Supplier...' : 'Nama Customer/Cabang...'}
                value={supplierOrRecipient}
                onChange={(e) => setSupplierOrRecipient(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {type === 'TRANSFER' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gudang / Lokasi Tujuan
                </label>
                <select
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Pilih Lokasi Tujuan...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi Rak / Gudang
                </label>
                <input
                  type="text"
                  disabled
                  value={currentItem?.location || ''}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Transaksi / Alasan
            </label>
            <textarea
              rows={2}
              placeholder="misal: Penerimaan PO rutin, pengiriman pesanan nomor #102, barang rusak saat audit, dll."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isInvalidOut}
              className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-md ${
                type === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : type === 'OUT'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : type === 'ADJUSTMENT'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Simpan & Mutasi Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
