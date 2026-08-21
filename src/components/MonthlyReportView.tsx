import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Layers,
  FileText,
  Clock,
} from 'lucide-react';
import { MonthlyReportData, InventoryItem, StockMovement } from '../types';
import {
  generateMonthlyReportData,
  formatNumber,
  formatRupiah,
  INDONESIAN_MONTHS,
} from '../services/storageService';

interface MonthlyReportViewProps {
  items?: InventoryItem[];
  movements?: StockMovement[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  items = [],
  movements = [],
}) => {
  const safeItems = items || [];
  const safeMovements = movements || [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Generate or recalculate report whenever period changes or items/movements change
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const data = await generateMonthlyReportData(selectedYear, selectedMonth);
      if (isMounted) {
        setReportData(data);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [selectedYear, selectedMonth, safeItems, safeMovements]);

  // AI Analysis trigger via server-side Gemini API
  const handleGenerateAiAnalysis = async () => {
    if (!reportData) return;
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const payload = {
        period: `${reportData.monthName} ${reportData.year}`,
        totalValuation: reportData.closingValuation,
        summary: {
          openingValuation: reportData.openingValuation,
          closingValuation: reportData.closingValuation,
          totalInQty: reportData.totalStockInQty,
          totalInValue: reportData.totalStockInValue,
          totalOutQty: reportData.totalStockOutQty,
          totalOutValue: reportData.totalStockOutValue,
          turnoverRatio: reportData.netTurnoverRatio,
        },
        fastMoving: reportData.fastMovingItems,
        lowStock: safeItems
          .filter((it) => it.status !== 'in_stock')
          .map((it) => ({
            sku: it.sku,
            name: it.name,
            currentStock: it.currentStock,
            minStock: it.minStock,
            costPrice: it.costPrice,
          })),
        categoryBreakdown: reportData.categoryBreakdown.map((c) => ({
          category: c.category,
          valuation: c.totalValuation,
          count: c.totalQuantity,
        })),
      };

      const res = await fetch('/api/gemini/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.analysis) {
        setReportData((prev) => (prev ? { ...prev, aiAnalysis: json.analysis } : null));
      } else {
        throw new Error(json.error || 'Gagal memperoleh analisis AI');
      }
    } catch (err: any) {
      console.error('Error generating AI analysis', err);
      setAiError('Analisis AI menggunakan estimasi lokal: ' + (err.message || 'Koneksi error'));
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const headers = [
      'SKU',
      'Nama Barang',
      'Kategori',
      'Satuan',
      'Harga Beli HPP (IDR)',
      'Stok Awal',
      'Total Masuk',
      'Total Keluar',
      'Penyesuaian',
      'Stok Akhir',
      'Total Valuasi (IDR)',
      'Status',
    ];

    const rows = reportData.itemLedgers.map((l) => [
      `"${l.sku}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.unit}"`,
      l.costPrice,
      l.openingStock,
      l.totalIn,
      l.totalOut,
      l.adjustment,
      l.closingStock,
      l.closingValuation,
      `"${l.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      `"LAPORAN INVENTARIS BULANAN - ${reportData.monthName.toUpperCase()} ${reportData.year}"\n\n` +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Inventaris_${reportData.year}_${String(selectedMonth + 1).padStart(2, '0')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!reportData) return null;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Filter & Actions Bar (Hidden on Print) */}
      <div className="no-print bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Laporan Otomatis Bulanan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generator audit otomatis pergerakan stok, neraca mutasi, valuasi aset FIFO/Average, dan rekomendasi restock AI.
          </p>
        </div>

        {/* Period Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-2" />
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 py-1.5 pr-2 focus:outline-none cursor-pointer"
            >
              {INDONESIAN_MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              id="report-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 py-1.5 pr-2 focus:outline-none cursor-pointer border-l border-slate-200 pl-2"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            id="report-ai-analyze-btn"
            onClick={handleGenerateAiAnalysis}
            disabled={isLoadingAi}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm transition-all disabled:opacity-50"
          >
            {isLoadingAi ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{isLoadingAi ? 'Menganalisis...' : 'Analisis AI Gemini'}</span>
          </button>

          <button
            id="report-export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV</span>
          </button>

          <button
            id="report-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Main Printable Report Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 lg:p-8 space-y-6">
        {/* Printable Official Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
                IN
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                INVENTA LOGISTICS & INVENTORY SYSTEM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dokumen Resmi: Laporan Eksekutif Mutasi & Valuasi Inventaris Bulanan
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 font-mono">
            <div className="font-bold text-slate-900 text-sm">
              PERIODE: {reportData.monthName.toUpperCase()} {reportData.year}
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Dibuat pada: {new Date(reportData.generatedAt).toLocaleString('id-ID')}
            </div>
            <div className="text-slate-400 text-[11px]">
              Otoritas: {reportData.generatedBy}
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Valuasi Akhir Bulan
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-slate-900 font-mono mt-1">
              {formatRupiah(reportData.closingValuation)}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Awal: {formatRupiah(reportData.openingValuation)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Total Pembelian / Masuk (+)
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-emerald-900 font-mono mt-1">
              {formatRupiah(reportData.totalStockInValue)}
            </div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              {formatNumber(reportData.totalStockInQty)} Unit Fisik
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Total Pengeluaran / HPP (-)
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-amber-900 font-mono mt-1">
              {formatRupiah(reportData.totalStockOutValue)}
            </div>
            <span className="text-[10px] text-amber-700 mt-0.5 block">
              {formatNumber(reportData.totalStockOutQty)} Unit Terjual/Terdistribusi
            </span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider block">
              Turnover Ratio & Margin
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-indigo-900 font-mono mt-1">
              {reportData.netTurnoverRatio}x
            </div>
            <span className="text-[10px] text-indigo-700 mt-0.5 block">
              Est. Profit: {formatRupiah(reportData.grossEstimatedProfit)}
            </span>
          </div>
        </div>

        {/* AI Smart Analysis Section */}
        {reportData.aiAnalysis ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-700/50 shadow-md">
            <div className="flex items-center justify-between mb-3 border-b border-indigo-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-sm text-white">
                  Analisis Eksekutif AI (Gemini 3.7 Flash)
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                Skor Efisiensi: {reportData.aiAnalysis.efficiencyScore}/100 • {reportData.aiAnalysis.healthStatus}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {reportData.aiAnalysis.executiveSummary}
            </p>

            {/* Strategic Insights */}
            <div className="mt-3.5 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Temuan Kunci Operasional:
              </span>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {reportData.aiAnalysis.keyInsights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>

            {/* Restock Recommendations */}
            {reportData.aiAnalysis.restockRecommendations?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-indigo-800/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block mb-2">
                  Rekomendasi Pengadaan / Restock Prioritas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reportData.aiAnalysis.restockRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white block">{rec.name}</span>
                        <span className="text-[11px] text-slate-300">
                          Sisa: {rec.currentStock} | Min: {rec.minStock} | Rekomendasi: +{rec.recommendedQty}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/80 text-white">
                          {rec.urgency}
                        </span>
                        <div className="text-[11px] font-mono text-emerald-300 mt-1">
                          {formatRupiah(rec.estimatedCost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-print p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-indigo-950">
                  Ingin Analisis Naratif & Saran Pengadaan Cerdas?
                </h4>
                <p className="text-[11px] text-indigo-700">
                  Gunakan AI Gemini untuk menghasilkan ringkasan eksekutif, identifikasi dead stock, dan rekomendasi restock.
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateAiAnalysis}
              disabled={isLoadingAi}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {isLoadingAi ? 'Memproses...' : 'Generate AI Insights'}
            </button>
          </div>
        )}

        {/* Fast Moving vs Slow Moving Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Fast Moving Items */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Top 5 Item Terlaris (Fast-Moving)
              </h4>
            </div>
            <div className="space-y-2">
              {reportData.fastMovingItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 last:border-0"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-900 block truncate">
                      {i + 1}. {item.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {item.sku} • {item.category}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-700 block font-mono">
                      {formatNumber(item.quantityOut)} Unit
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatRupiah(item.valueOut)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Moving / Tied Capital */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Item Mengendap / Slow-Moving (Modal Tertahan)
              </h4>
            </div>
            <div className="space-y-2">
              {reportData.slowMovingItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 last:border-0"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-900 block truncate">
                      {i + 1}. {item.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Stok Mengendap: {item.currentStock} Unit (~{item.daysInactive} hari)
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-amber-700 block font-mono">
                      {formatRupiah(item.tiedCapital)}
                    </span>
                    <span className="text-[10px] text-slate-400">Modal Tertahan</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Complete Stock Ledger Balance Sheet Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">
              Neraca Mutasi Inventaris Lengkap
            </h4>
            <span className="text-xs text-slate-500">
              Total: {reportData.itemLedgers.length} SKU
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">SKU & Barang</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">HPP</th>
                  <th className="py-2.5 px-3 text-right">Stok Awal</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Masuk (+)</th>
                  <th className="py-2.5 px-3 text-right text-amber-700">Keluar (-)</th>
                  <th className="py-2.5 px-3 text-right">Penyesuaian</th>
                  <th className="py-2.5 px-3 text-right font-bold">Stok Akhir</th>
                  <th className="py-2.5 px-3 text-right font-bold">Valuasi Akhir</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.itemLedgers.map((l) => (
                  <tr key={l.itemId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{l.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{l.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{l.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatRupiah(l.costPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatNumber(l.openingStock)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                      +{formatNumber(l.totalIn)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600">
                      -{formatNumber(l.totalOut)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {l.adjustment > 0 ? `+${l.adjustment}` : l.adjustment}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      {formatNumber(l.closingStock)} {l.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(l.closingValuation)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          l.status === 'out_of_stock'
                            ? 'bg-red-100 text-red-700'
                            : l.status === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : l.status === 'low_stock'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {l.status === 'in_stock' ? 'AMAN' : l.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Signatures (Visible on Print) */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-600">
          <div>
            <p className="text-[11px] text-slate-400">Dibuat Oleh:</p>
            <div className="h-14" />
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
              Admin / Petugas Inventaris
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Diperiksa Oleh:</p>
            <div className="h-14" />
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
              Supervisor Logistik & Gudang
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Disetujui Oleh:</p>
            <div className="h-14" />
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
              Kepala Operasional / Direktur
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
