import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  FileText,
  Printer,
  Calendar,
  Building2,
  User,
  PlusCircle,
} from 'lucide-react';
import { StockMovement, MovementType } from '../types';
import { formatNumber, formatRupiah } from '../services/storageService';

interface StockMovementsViewProps {
  movements?: StockMovement[];
  onOpenQuickMutation: (type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER') => void;
  onPrintDeliveryNote: (movement: StockMovement) => void;
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({
  movements = [],
  onOpenQuickMutation,
  onPrintDeliveryNote,
}) => {
  const safeMovements = movements || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredMovements = safeMovements.filter((m) => {
    const matchesSearch =
      (m.referenceNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (m.itemName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (m.itemSku || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (m.operator || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (m.supplierOrRecipient && m.supplierOrRecipient.toLowerCase().includes((searchQuery || '').toLowerCase()));

    const matchesType = selectedType === 'ALL' || m.type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Riwayat Mutasi & Transaksi Stok
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Buku besar lengkap pergerakan barang masuk (PO), keluar (DO), penyesuaian (Opname), dan transfer antar gudang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenQuickMutation('IN')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <ArrowDownRight className="w-4 h-4" />
            + Barang Masuk
          </button>
          <button
            onClick={() => onOpenQuickMutation('OUT')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            - Barang Keluar
          </button>
          <button
            onClick={() => onOpenQuickMutation('ADJUSTMENT')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Penyesuaian / Opname
          </button>
        </div>
      </div>

      {/* Filter Chips & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Referensi, SKU, Produk, Penerima, atau Petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">🔄 Semua Tipe Mutasi</option>
          <option value="IN">📥 Barang Masuk (Purchase/Receipt)</option>
          <option value="OUT">📤 Barang Keluar (Sales/Dispatch)</option>
          <option value="ADJUSTMENT">⚙️ Penyesuaian (Stock Opname)</option>
          <option value="TRANSFER">🚚 Transfer Antar Lokasi</option>
        </select>
      </div>

      {/* Movement Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4">No. Referensi</th>
                <th className="py-3 px-4">Jenis Mutasi</th>
                <th className="py-3 px-4">Barang & SKU</th>
                <th className="py-3 px-4 text-right">Kuantitas</th>
                <th className="py-3 px-4 text-right">Nilai Total</th>
                <th className="py-3 px-4">Stok Sebelum &gt; Sesudah</th>
                <th className="py-3 px-4">Tujuan / Sumber</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-center">Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Tidak ada catatan mutasi yang sesuai filter
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(mov.timestamp).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {mov.referenceNumber}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mov.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mov.type === 'OUT'
                            ? 'bg-amber-100 text-amber-800'
                            : mov.type === 'ADJUSTMENT'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {mov.type === 'IN'
                          ? 'MASUK'
                          : mov.type === 'OUT'
                          ? 'KELUAR'
                          : mov.type === 'ADJUSTMENT'
                          ? 'OPNAME'
                          : 'TRANSFER'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 max-w-[200px] truncate">
                        {mov.itemName}
                      </div>
                      <div className="font-mono text-[10px] text-indigo-600 font-semibold">
                        {mov.itemSku}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
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

                    <td className="py-3 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatRupiah(mov.totalCost)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                      {mov.previousStock} &rarr;{' '}
                      <strong className="text-slate-900">{mov.newStock}</strong> {mov.unit}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate text-xs">
                      {mov.supplierOrRecipient || mov.sourceLocation}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{mov.operator}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onPrintDeliveryNote(mov)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
                        title="Cetak Surat Jalan / Bukti Terima"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
