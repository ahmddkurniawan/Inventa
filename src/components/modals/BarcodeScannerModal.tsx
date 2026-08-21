import React, { useState } from 'react';
import {
  X,
  QrCode,
  Printer,
  Search,
  CheckCircle2,
  ScanLine,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { formatNumber, formatRupiah } from '../../services/storageService';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  activeItem?: InventoryItem | null;
  onSelectItem: (item: InventoryItem) => void;
  onQuickMutate: (type: 'IN' | 'OUT', item: InventoryItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  activeItem,
  onSelectItem,
  onQuickMutate,
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(activeItem || null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  if (!isOpen) return null;

  const itemToDisplay = selectedProduct || activeItem || items[0];

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode.trim()) return;

    setIsSimulatingScan(true);
    setTimeout(() => {
      const match = items.find(
        (it) =>
          it.barcode.toLowerCase() === scannedCode.trim().toLowerCase() ||
          it.sku.toLowerCase() === scannedCode.trim().toLowerCase()
      );
      if (match) {
        setSelectedProduct(match);
        onSelectItem(match);
      } else {
        alert(`SKU/Barcode "${scannedCode}" tidak ditemukan di database.`);
      }
      setIsSimulatingScan(false);
      setScannedCode('');
    }, 400);
  };

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Barcode & SKU Scanner
              </h3>
              <p className="text-xs text-slate-500">
                Simulasi pemindai barcode gudang & cetak label rak
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

        {/* Scan input simulation */}
        <form onSubmit={handleScanSubmit} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Simulasi Input Pemindai / Barcode Scanner:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <ScanLine className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan / Ketik Barcode atau SKU (misal: 899100100101)..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                className="w-full pl-9.5 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={isSimulatingScan}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              {isSimulatingScan ? 'Scanning...' : 'Cari Item'}
            </button>
          </div>
        </form>

        {/* Barcode / Label Preview Card */}
        {itemToDisplay && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pratinjau Label Fisik Rak Gudang
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs max-w-xs mx-auto space-y-2">
              <div className="font-extrabold text-sm text-slate-900 truncate">
                {itemToDisplay.name}
              </div>

              {/* Synthetic Barcode Lines Representation */}
              <div className="py-2 flex items-center justify-center">
                <div className="flex items-end gap-1 h-12 px-2 bg-slate-50 border border-slate-100 rounded">
                  {/* Generated alternating barcode stripes */}
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1].map(
                    (w, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="font-mono text-xs font-bold text-slate-800">
                {itemToDisplay.barcode}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {itemToDisplay.sku}
                </span>
                <span className="truncate max-w-[120px]">{itemToDisplay.location}</span>
              </div>
            </div>

            {/* Quick action buttons for scanned item */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs">
              <button
                onClick={() => {
                  onQuickMutate('IN', itemToDisplay);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 transition-colors"
              >
                + Stok Masuk
              </button>
              <button
                onClick={() => {
                  onQuickMutate('OUT', itemToDisplay);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold border border-amber-200 transition-colors"
              >
                - Stok Keluar
              </button>
              <button
                onClick={handlePrintLabel}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold transition-colors flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Label
              </button>
            </div>
          </div>
        )}

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
