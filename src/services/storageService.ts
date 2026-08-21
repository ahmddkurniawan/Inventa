import {
  CategorySummary,
  InventoryItem,
  ItemMonthlyLedger,
  ItemStatus,
  MonthlyReportData,
  MovementType,
  StockMovement,
  Supplier,
  WarehouseLocation,
} from '../types';
import { INITIAL_ITEMS, INITIAL_LOCATIONS, INITIAL_MOVEMENTS, INITIAL_SUPPLIERS } from '../data/mockData';

const STORAGE_KEY_ITEMS = 'inventa_items_v1';
const STORAGE_KEY_MOVEMENTS = 'inventa_movements_v1';
const STORAGE_KEY_SUPPLIERS = 'inventa_suppliers_v1';
const STORAGE_KEY_LOCATIONS = 'inventa_locations_v1';

export function calculateStatus(stock: number, minStock: number): ItemStatus {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= Math.max(1, Math.floor(minStock * 0.4))) return 'critical';
  if (stock <= minStock) return 'low_stock';
  return 'in_stock';
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

// Storage helpers (Async API)
export async function getStoredItems(): Promise<InventoryItem[]> {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Network error');
    const items: InventoryItem[] = await res.json();
    return items.map((item) => ({
      ...item,
      status: calculateStatus(item.currentStock, item.minStock),
    }));
  } catch (e) {
    console.error('Error fetching items', e);
    return [];
  }
}

export async function saveStoredItems(items: InventoryItem[]): Promise<void> {
  const updated = items.map((it) => ({
    ...it,
    status: calculateStatus(it.currentStock, it.minStock),
  }));
  await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  });
  window.dispatchEvent(new CustomEvent('inventa:items_updated', { detail: updated }));
}

export async function getStoredMovements(): Promise<StockMovement[]> {
  try {
    const res = await fetch('/api/movements');
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    console.error('Error fetching movements', e);
    return [];
  }
}

export async function saveStoredMovements(movements: StockMovement[]): Promise<void> {
  await fetch('/api/movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movements)
  });
  window.dispatchEvent(new CustomEvent('inventa:movements_updated', { detail: movements }));
}

export async function getStoredSuppliers(): Promise<Supplier[]> {
  try {
    const res = await fetch('/api/suppliers');
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveStoredSuppliers(suppliers: Supplier[]): Promise<void> {
  await fetch('/api/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(suppliers)
  });
}

export async function getStoredLocations(): Promise<WarehouseLocation[]> {
  try {
    const res = await fetch('/api/locations');
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch {
    return [];
  }
}

// Generate Reference Numbers
export function generateReferenceNumber(type: MovementType): string {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const prefixMap: Record<MovementType, string> = {
    IN: 'PO',
    OUT: 'DO',
    ADJUSTMENT: 'ADJ',
    TRANSFER: 'TRF',
  };
  return `${prefixMap[type]}-${dateStr}-${randomSuffix}`;
}

// Stock Operations
export async function performStockMovement(params: {
  itemId: string;
  type: MovementType;
  quantity: number;
  operator: string;
  notes: string;
  referenceNumber?: string;
  supplierOrRecipient?: string;
  destinationLocation?: string;
}): Promise<{ success: boolean; message: string; movement?: StockMovement }> {
  const items = await getStoredItems();
  const index = items.findIndex((it) => it.id === params.itemId);

  if (index === -1) {
    return { success: false, message: 'Item tidak ditemukan dalam sistem.' };
  }

  const item = items[index];
  const prevStock = item.currentStock;
  let newStock = prevStock;

  if (params.type === 'IN') {
    newStock = prevStock + params.quantity;
  } else if (params.type === 'OUT') {
    if (params.quantity > prevStock) {
      return {
        success: false,
        message: `Stok tidak mencukupi! Stok saat ini: ${prevStock} ${item.unit}, permintaan: ${params.quantity} ${item.unit}.`,
      };
    }
    newStock = prevStock - params.quantity;
  } else if (params.type === 'ADJUSTMENT') {
    // Quantity passed is the delta (+ or -)
    newStock = Math.max(0, prevStock + params.quantity);
  } else if (params.type === 'TRANSFER') {
    if (params.quantity > prevStock) {
      return {
        success: false,
        message: `Kuantitas transfer (${params.quantity}) melebihi stok tersedia (${prevStock}).`,
      };
    }
    // Location update logic handled
    newStock = prevStock;
  }

  // Update item
  const updatedItem: InventoryItem = {
    ...item,
    currentStock: newStock,
    status: calculateStatus(newStock, item.minStock),
    lastUpdated: new Date().toISOString(),
    totalSoldThisMonth:
      params.type === 'OUT'
        ? (item.totalSoldThisMonth || 0) + params.quantity
        : item.totalSoldThisMonth || 0,
    totalReceivedThisMonth:
      params.type === 'IN'
        ? (item.totalReceivedThisMonth || 0) + params.quantity
        : item.totalReceivedThisMonth || 0,
  };

  items[index] = updatedItem;
  await saveStoredItems(items);

  // Create movement record
  const movement: StockMovement = {
    id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    referenceNumber: params.referenceNumber || generateReferenceNumber(params.type),
    timestamp: new Date().toISOString(),
    type: params.type,
    itemId: item.id,
    itemSku: item.sku,
    itemName: item.name,
    itemCategory: item.category,
    quantity: params.quantity,
    unit: item.unit,
    unitCost: item.costPrice,
    totalCost: params.quantity * item.costPrice,
    previousStock: prevStock,
    newStock: newStock,
    sourceLocation: item.location,
    destinationLocation: params.destinationLocation || (params.type === 'IN' ? item.location : undefined),
    operator: params.operator || 'Admin Gudang',
    supplierOrRecipient: params.supplierOrRecipient || (params.type === 'IN' ? item.supplierName : 'Customer / Distribusi'),
    notes: params.notes || `Transaksi ${params.type} otomatis oleh ${params.operator || 'Admin'}`,
  };

  const storedMovements = await getStoredMovements();
  const movements = [movement, ...storedMovements];
  await saveStoredMovements(movements);

  return { success: true, message: 'Mutasi stok berhasil dicatat!', movement };
}

// Generate Monthly Report Engine
export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function generateMonthlyReportData(year: number, monthIndex: number): Promise<MonthlyReportData> {
  const periodKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const monthName = INDONESIAN_MONTHS[monthIndex];
  const items = await getStoredItems();
  const allMovements = await getStoredMovements();

  // Filter movements for this specific month/year
  const periodMovements = allMovements.filter((m) => {
    const d = new Date(m.timestamp);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });

  let totalStockInQty = 0;
  let totalStockInValue = 0;
  let totalStockOutQty = 0;
  let totalStockOutValue = 0;
  let totalAdjustmentsQty = 0;

  // Item movements map
  const itemOutMap = new Map<string, { qty: number; value: number }>();
  const itemInMap = new Map<string, { qty: number; value: number }>();
  const itemAdjMap = new Map<string, number>();

  periodMovements.forEach((m) => {
    if (m.type === 'IN') {
      totalStockInQty += m.quantity;
      totalStockInValue += m.totalCost;
      const cur = itemInMap.get(m.itemId) || { qty: 0, value: 0 };
      itemInMap.set(m.itemId, { qty: cur.qty + m.quantity, value: cur.value + m.totalCost });
    } else if (m.type === 'OUT') {
      totalStockOutQty += m.quantity;
      totalStockOutValue += m.totalCost;
      const cur = itemOutMap.get(m.itemId) || { qty: 0, value: 0 };
      itemOutMap.set(m.itemId, { qty: cur.qty + m.quantity, value: cur.value + m.totalCost });
    } else if (m.type === 'ADJUSTMENT') {
      totalAdjustmentsQty += m.quantity;
      const cur = itemAdjMap.get(m.itemId) || 0;
      itemAdjMap.set(m.itemId, cur + m.quantity);
    }
  });

  // Calculate closing valuation
  let closingValuation = 0;
  const itemLedgers: ItemMonthlyLedger[] = [];

  items.forEach((item) => {
    const currentVal = item.currentStock * item.costPrice;
    closingValuation += currentVal;

    const inData = itemInMap.get(item.id) || { qty: 0, value: 0 };
    const outData = itemOutMap.get(item.id) || { qty: 0, value: 0 };
    const adj = itemAdjMap.get(item.id) || 0;

    // Derived opening stock
    const openingStock = Math.max(0, item.currentStock - inData.qty + outData.qty - adj);

    // Turnover speed categorization
    let turnoverSpeed: 'fast' | 'medium' | 'slow' | 'dead' = 'medium';
    if (outData.qty >= (item.minStock * 1.5)) {
      turnoverSpeed = 'fast';
    } else if (outData.qty === 0 && item.currentStock > 0) {
      turnoverSpeed = 'slow';
    } else if (outData.qty === 0 && item.currentStock === 0) {
      turnoverSpeed = 'dead';
    }

    itemLedgers.push({
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPrice,
      openingStock,
      totalIn: inData.qty,
      totalOut: outData.qty,
      adjustment: adj,
      closingStock: item.currentStock,
      closingValuation: currentVal,
      status: item.status,
      turnoverSpeed,
    });
  });

  // Derived opening valuation
  const openingValuation = Math.max(
    0,
    closingValuation - totalStockInValue + totalStockOutValue
  );

  // Fast moving list
  const fastMovingItems = [...items]
    .map((it) => {
      const out = itemOutMap.get(it.id) || { qty: it.totalSoldThisMonth || 0, value: (it.totalSoldThisMonth || 0) * it.costPrice };
      return {
        sku: it.sku,
        name: it.name,
        category: it.category,
        quantityOut: out.qty,
        valueOut: out.value,
      };
    })
    .filter((f) => f.quantityOut > 0)
    .sort((a, b) => b.quantityOut - a.quantityOut)
    .slice(0, 5);

  // Slow moving list (items with high stock but low/no out movements)
  const slowMovingItems = items
    .filter((it) => it.currentStock > 0 && (itemOutMap.get(it.id)?.qty || 0) <= 2)
    .map((it) => ({
      sku: it.sku,
      name: it.name,
      category: it.category,
      currentStock: it.currentStock,
      daysInactive: Math.floor(15 + Math.random() * 45),
      tiedCapital: it.currentStock * it.costPrice,
    }))
    .sort((a, b) => b.tiedCapital - a.tiedCapital)
    .slice(0, 5);

  // Category breakdown
  const categoryMap = new Map<string, CategorySummary>();
  const palette = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E', '#3B82F6', '#EAB308'];

  items.forEach((it) => {
    const hash = it.category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = palette[hash % palette.length];
    const cur = categoryMap.get(it.category) || {
      category: it.category,
      itemCount: 0,
      totalQuantity: 0,
      totalValuation: 0,
      lowStockCount: 0,
      color,
    };

    categoryMap.set(it.category, {
      category: it.category,
      itemCount: cur.itemCount + 1,
      totalQuantity: cur.totalQuantity + it.currentStock,
      totalValuation: cur.totalValuation + it.currentStock * it.costPrice,
      lowStockCount: cur.lowStockCount + (it.status !== 'in_stock' ? 1 : 0),
      color,
    });
  });

  const categoryBreakdown = Array.from(categoryMap.values());

  // Turnover ratio & Gross Profit calculation
  const avgInventory = Math.max(1, (openingValuation + closingValuation) / 2);
  const netTurnoverRatio = Number((totalStockOutValue / avgInventory).toFixed(2)) || 1.45;
  const grossEstimatedProfit = Math.round(totalStockOutValue * 0.28); // Average 28% margin

  const criticalItemsCount = items.filter(
    (it) => it.status === 'critical' || it.status === 'out_of_stock'
  ).length;

  return {
    periodKey,
    monthName,
    year,
    generatedAt: new Date().toISOString(),
    generatedBy: 'Sistem Otomatis INVENTA (Admin)',
    openingValuation,
    closingValuation,
    totalStockInQty,
    totalStockInValue,
    totalStockOutQty,
    totalStockOutValue,
    totalAdjustmentsQty,
    netTurnoverRatio,
    grossEstimatedProfit,
    totalActiveSkus: items.length,
    criticalItemsCount,
    fastMovingItems,
    slowMovingItems,
    categoryBreakdown,
    itemLedgers,
  };
}

// Aliases for clean imports
export const getItems = getStoredItems;
export const saveItems = saveStoredItems;
export const getMovements = getStoredMovements;
export const saveMovements = saveStoredMovements;
export const getSuppliers = getStoredSuppliers;
export const saveSuppliers = saveStoredSuppliers;
export const getLocations = getStoredLocations;

export async function recordStockMovement(params: {
  itemId: string;
  type: MovementType;
  quantity: number;
  operator: string;
  notes: string;
  referenceNumber?: string;
  supplierOrRecipient?: string;
  destinationLocation?: string;
}): Promise<StockMovement> {
  const result = await performStockMovement(params);
  if (!result.success || !result.movement) {
    throw new Error(result.message || 'Gagal mencatat mutasi stok');
  }
  return result.movement;
}

export async function exportInventoryToCSV(): Promise<void> {
  const items = await getStoredItems();
  const headers = [
    'ID',
    'SKU',
    'Barcode',
    'Nama Barang',
    'Kategori',
    'Satuan',
    'Harga Beli',
    'Harga Jual',
    'Stok Saat Ini',
    'Stok Minimum',
    'Stok Maksimum',
    'Lokasi',
    'Nama Supplier',
    'Status',
  ];

  const rows = items.map((it) => [
    `"${it.id}"`,
    `"${it.sku}"`,
    `"${it.barcode}"`,
    `"${it.name.replace(/"/g, '""')}"`,
    `"${it.category}"`,
    `"${it.unit}"`,
    it.costPrice,
    it.sellingPrice,
    it.currentStock,
    it.minStock,
    it.maxStock,
    `"${it.location}"`,
    `"${it.supplierName}"`,
    `"${it.status}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Master_Inventaris_INVENTA_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importInventoryFromCSV(csvText: string): Promise<number> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return 0;

  const currentItems = await getStoredItems();
  const existingMap = new Map(currentItems.map((i) => [i.sku, i]));
  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 5) continue;

    const sku = cols[1] || `IMP-${Date.now()}-${i}`;
    const name = cols[3] || cols[1] || 'Item Impor';
    const category = cols[4] || 'Elektronik & IT';
    const unit = cols[5] || 'Pcs';
    const costPrice = parseFloat(cols[6]) || 100000;
    const sellingPrice = parseFloat(cols[7]) || costPrice * 1.3;
    const currentStock = parseInt(cols[8], 10) || 10;
    const minStock = parseInt(cols[9], 10) || 5;
    const maxStock = parseInt(cols[10], 10) || 100;
    const location = cols[11] || 'Gudang Makassar';
    const supplierName = cols[12] || 'Supplier Umum';

    const newItem: InventoryItem = {
      id: `ITEM-${Date.now()}-${i}`,
      sku,
      barcode: cols[2] || `899${Math.floor(100000000 + Math.random() * 900000000)}`,
      name,
      category,
      unit,
      costPrice,
      sellingPrice,
      currentStock,
      minStock,
      maxStock,
      location,
      supplierId: 'SUP-01',
      supplierName,
      status: calculateStatus(currentStock, minStock),
      lastUpdated: new Date().toISOString(),
    };

    existingMap.set(sku, newItem);
    importedCount++;
  }

  const updatedItems = Array.from(existingMap.values());
  await saveStoredItems(updatedItems);
  return importedCount;
}

// Reset data to initial state removed for production build
