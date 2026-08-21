export type ItemStatus = 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock';

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: string; // Pcs, Box, Kg, Unit, Pack, Rim, dll.
  costPrice: number; // Harga Beli (IDR)
  sellingPrice: number; // Harga Jual (IDR)
  currentStock: number;
  minStock: number; // Ambang batas stok minimum
  maxStock: number; // Kapasitas maksimum rak
  location: string; // misal "Gudang Utama - Rak A1"
  supplierId: string;
  supplierName: string;
  status: ItemStatus;
  lastUpdated: string;
  batchNumber?: string;
  expirationDate?: string;
  notes?: string;
  totalSoldThisMonth?: number;
  totalReceivedThisMonth?: number;
}

export interface StockMovement {
  id: string;
  referenceNumber: string; // PO-202608-001, DO-202608-001, ADJ-202608-001, TRF-202608-001
  timestamp: string;
  type: MovementType;
  itemId: string;
  itemSku: string;
  itemName: string;
  itemCategory: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  previousStock: number;
  newStock: number;
  sourceLocation: string;
  destinationLocation?: string;
  operator: string;
  supplierOrRecipient?: string;
  notes: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  leadTimeDays: number;
  rating: number; // 1-5
}

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  zone: string;
  maxCapacity: number;
  currentUsage: number;
  manager: string;
}

export interface CategorySummary {
  category: string;
  itemCount: number;
  totalQuantity: number;
  totalValuation: number;
  lowStockCount: number;
  color: string;
}

export interface ItemMonthlyLedger {
  itemId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  openingStock: number;
  totalIn: number;
  totalOut: number;
  adjustment: number;
  closingStock: number;
  closingValuation: number;
  status: ItemStatus;
  turnoverSpeed: 'fast' | 'medium' | 'slow' | 'dead';
}

export interface RestockRecommendation {
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  recommendedQty: number;
  urgency: string;
  estimatedCost: number;
  reason?: string;
}

export interface AIAnalysisResult {
  executiveSummary: string;
  keyInsights: string[];
  restockRecommendations: RestockRecommendation[];
  efficiencyScore: number;
  healthStatus: string;
}

export interface MonthlyReportData {
  periodKey: string; // YYYY-MM
  monthName: string;
  year: number;
  generatedAt: string;
  generatedBy: string;
  openingValuation: number;
  closingValuation: number;
  totalStockInQty: number;
  totalStockInValue: number;
  totalStockOutQty: number;
  totalStockOutValue: number;
  totalAdjustmentsQty: number;
  netTurnoverRatio: number;
  grossEstimatedProfit: number;
  totalActiveSkus: number;
  criticalItemsCount: number;
  fastMovingItems: {
    sku: string;
    name: string;
    category: string;
    quantityOut: number;
    valueOut: number;
  }[];
  slowMovingItems: {
    sku: string;
    name: string;
    category: string;
    currentStock: number;
    daysInactive: number;
    tiedCapital: number;
  }[];
  categoryBreakdown: CategorySummary[];
  itemLedgers: ItemMonthlyLedger[];
  aiAnalysis?: AIAnalysisResult;
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK';
  severity: 'warning' | 'critical';
  timestamp: string;
}

export type ActiveTab = 'dashboard' | 'realtime' | 'products' | 'movements' | 'reports' | 'suppliers' | 'settings';
