import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { StockMovement } from '../../types';
import { formatNumber, formatRupiah } from '../../services/storageService';

interface DeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StockMovement | null;
}

export const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({
  isOpen,
  onClose,
  movement,
}) => {
  if (!isOpen || !movement) return null;

  const handlePrint = () => {
    window.print();
  };

  const isMasuk = movement.type === 'IN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">
              Dokumen Mutasi Inventaris
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Slip */}
        <div className="border border-slate-200 rounded-2xl p-6 space-y-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="font-extrabold text-base text-slate-900">
                PT INVENTA LOGISTIK NUSANTARA
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Kawasan Pergudangan Terpadu Blok A-12, Jakarta
              </div>
              <div className="text-slate-500 text-[11px]">
                Telp: (021) 5566-7788 | Email: logistic@inventa.co.id
              </div>
            </div>

            <div className="text-right font-mono">
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold ${
                  isMasuk
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isMasuk ? 'BUKTI PENERIMAAN BARANG (PO)' : 'SURAT JALAN / PENGELUARAN (DO)'}
              </span>
              <div className="font-bold text-sm text-slate-900 mt-1">
                {movement.referenceNumber}
              </div>
              <div className="text-slate-500 text-[10px]">
                Tgl: {new Date(movement.timestamp).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {isMasuk ? 'Diterima Dari (Supplier):' : 'Ditujukan Kepada (Penerima):'}
              </span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {movement.supplierOrRecipient || '-'}
              </span>
              <span className="text-slate-500 text-[11px]">
                Lokasi Asal/Tujuan: {movement.sourceLocation}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Petugas Penanggung Jawab:
              </span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {movement.operator}
              </span>
              <span className="text-slate-500 text-[11px]">
                Status Verifikasi: Selesai & Dicatat di Sistem
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Nama Deskripsi Barang</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right">Total Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                    {movement.itemSku}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{movement.itemName}</div>
                    <div className="text-[10px] text-slate-400">{movement.itemCategory}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatNumber(movement.quantity)} {movement.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {formatRupiah(movement.unitCost)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(movement.totalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-xs">
            <span className="font-bold text-slate-700">Catatan / Keterangan: </span>
            {movement.notes || 'Tidak ada catatan tambahan.'}
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-slate-500 text-[11px]">Yang Menyerahkan,</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                ( {movement.operator} )
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[11px]">Yang Menerima,</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                ( {movement.supplierOrRecipient || 'Penerima Barang'} )
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
