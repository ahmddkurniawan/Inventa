import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  StockMovement,
  Supplier,
  WarehouseLocation,
  MovementType,
  StockAlert,
} from './types';
import {
  getItems,
  saveItems,
  getMovements,
  recordStockMovement,
  getSuppliers,
  saveSuppliers,
  getLocations,
  exportInventoryToCSV,
  importInventoryFromCSV,
  formatRupiah,
} from './services/storageService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RealTimeStockView } from './components/RealTimeStockView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { StockMovementsView } from './components/StockMovementsView';
import { ProductManagementView } from './components/ProductManagementView';
import { SuppliersView } from './components/SuppliersView';
import { StockMutationModal } from './components/modals/StockMutationModal';
import { ProductFormModal } from './components/modals/ProductFormModal';
import { BarcodeScannerModal } from './components/modals/BarcodeScannerModal';
import { DeliveryNoteModal } from './components/modals/DeliveryNoteModal';
import { CheckCircle2, AlertTriangle, Info, BellRing, Settings } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Global State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);

  // Modal States
  const [isMutationModalOpen, setIsMutationModalOpen] = useState<boolean>(false);
  const [mutationType, setMutationType] = useState<MovementType>('IN');
  const [selectedMutationItem, setSelectedMutationItem] = useState<InventoryItem | undefined>(undefined);

  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState<boolean>(false);
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState<InventoryItem | null>(null);

  const [isDeliveryNoteOpen, setIsDeliveryNoteOpen] = useState<boolean>(false);
  const [selectedMovementDoc, setSelectedMovementDoc] = useState<StockMovement | null>(null);

  // Load initial data and subscribe to storage changes
  const loadData = async () => {
    setItems(await getItems());
    setMovements(await getMovements());
    setSuppliers(await getSuppliers());
    setLocations(await getLocations());
  };

  useEffect(() => {
    loadData();

    const handleItemsUpdated = async () => {
      setItems(await getItems());
    };
    const handleMovementsUpdated = async () => {
      setMovements(await getMovements());
    };

    window.addEventListener('inventa:items_updated', handleItemsUpdated);
    window.addEventListener('inventa:movements_updated', handleMovementsUpdated);

    return () => {
      window.removeEventListener('inventa:items_updated', handleItemsUpdated);
      window.removeEventListener('inventa:movements_updated', handleMovementsUpdated);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Stock mutation handler
  const handleRecordMutation = async (data: {
    itemId: string;
    type: MovementType;
    quantity: number;
    operator: string;
    notes: string;
    referenceNumber: string;
    supplierOrRecipient: string;
    destinationLocation?: string;
  }) => {
    try {
      const movement = await recordStockMovement(data);
      await loadData();
      showToast(
        `Mutasi ${data.type} berhasil dicatat (${movement.referenceNumber})`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal mencatat mutasi', 'warn');
    }
  };

  // Product CRUD Handlers
  const handleSaveProduct = async (
    itemData: Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'>,
    id?: string
  ) => {
    const current = await getItems();
    if (id) {
      // Edit
      const updated = current.map((it) => {
        if (it.id === id) {
          const currentStock = itemData.currentStock;
          let status: InventoryItem['status'] = 'in_stock';
          if (currentStock <= 0) status = 'out_of_stock';
          else if (currentStock <= it.minStock * 0.4) status = 'critical';
          else if (currentStock <= it.minStock) status = 'low_stock';

          return {
            ...it,
            ...itemData,
            status,
            lastUpdated: new Date().toISOString(),
          };
        }
        return it;
      });
      await saveItems(updated);
      showToast(`Master produk "${itemData.name}" berhasil diperbarui`, 'success');
    } else {
      // Add
      const newItem: InventoryItem = {
        id: `ITEM-${Date.now()}`,
        ...itemData,
        status:
          itemData.currentStock <= 0
            ? 'out_of_stock'
            : itemData.currentStock <= itemData.minStock * 0.4
            ? 'critical'
            : itemData.currentStock <= itemData.minStock
            ? 'low_stock'
            : 'in_stock',
        lastUpdated: new Date().toISOString(),
      };
      saveItems([newItem, ...current]);
      showToast(`Produk baru "${itemData.name}" berhasil ditambahkan`, 'success');
    }
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    const current = await getItems();
    const target = current.find((i) => i.id === id);
    const updated = current.filter((it) => it.id !== id);
    await saveItems(updated);
    await loadData();
    showToast(`Produk "${target?.name || id}" telah dihapus`, 'info');
  };

  // Supplier Add Handler
  const handleAddSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    const current = await getSuppliers();
    const newSup: Supplier = {
      id: `SUP-${Date.now()}`,
      ...supplierData,
    };
    await saveSuppliers([...current, newSup]);
    await loadData();
    showToast(`Supplier "${supplierData.name}" berhasil didaftarkan`, 'success');
  };

  const handleEditSupplier = async (supplierData: Supplier) => {
    const current = await getSuppliers();
    const updated = current.map((s) => (s.id === supplierData.id ? supplierData : s));
    await saveSuppliers(updated);
    await loadData();
    showToast(`Supplier "${supplierData.name}" berhasil diperbarui`, 'success');
  };

  const handleDeleteSupplier = async (id: string) => {
    const current = await getSuppliers();
    const target = current.find((s) => s.id === id);
    const updated = current.filter((s) => s.id !== id);
    await saveSuppliers(updated);
    await loadData();
    showToast(`Supplier "${target?.name || id}" telah dihapus`, 'info');
  };

  // CSV Handlers
  const handleExportCSV = async () => {
    await exportInventoryToCSV();
    showToast('Katalog produk berhasil diekspor ke CSV', 'info');
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const count = await importInventoryFromCSV(text);
        await loadData();
        showToast(`${count} item produk berhasil diimpor dari CSV!`, 'success');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Modal Triggers
  const openQuickMutation = (type: MovementType, item?: InventoryItem) => {
    setMutationType(type);
    setSelectedMutationItem(item);
    setIsMutationModalOpen(true);
  };

  const openEditProduct = (item: InventoryItem) => {
    setEditingProduct(item);
    setIsProductModalOpen(true);
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const openBarcodeView = (item: InventoryItem) => {
    setSelectedBarcodeItem(item);
    setIsBarcodeModalOpen(true);
  };

  const openDeliveryNote = (movement: StockMovement) => {
    setSelectedMovementDoc(movement);
    setIsDeliveryNoteOpen(true);
  };

  // Compute Active Stock Alerts for Navbar
  const alerts: StockAlert[] = items
    .filter((it) => it.status !== 'in_stock')
    .map((it) => ({
      id: `ALT-${it.id}`,
      itemId: it.id,
      itemSku: it.sku,
      itemName: it.name,
      currentStock: it.currentStock,
      minStock: it.minStock,
      unit: it.unit,
      type: it.status === 'out_of_stock' ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      severity:
        it.status === 'out_of_stock'
          ? 'critical'
          : it.status === 'critical'
          ? 'critical'
          : 'warning',
      timestamp: it.lastUpdated,
    }));

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 left-5 md:left-auto z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'warn' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab as any}
        onTabChange={(tab) => setActiveTab(tab)}
        items={items}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <Navbar
          items={items}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenQuickMutation={(type, item) => openQuickMutation(type, item)}
          onOpenProductModal={openAddProduct}
          onSelectProduct={(item) => {
            setSelectedBarcodeItem(item);
            setIsBarcodeModalOpen(true);
          }}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* View Router */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              items={items}
              movements={movements}
              locations={locations}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenQuickMutation={(type, item) => openQuickMutation(type, item)}
              onOpenScanner={() => {
                setSelectedBarcodeItem(null);
                setIsBarcodeModalOpen(true);
              }}
            />
          )}

          {activeTab === 'realtime' && (
            <RealTimeStockView
              items={items}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
              onOpenQuickMutation={openQuickMutation}
              onEditProduct={openEditProduct}
              onViewBarcode={openBarcodeView}
              onOpenAddProduct={openAddProduct}
            />
          )}

          {activeTab === 'reports' && (
            <MonthlyReportView items={items} movements={movements} />
          )}

          {activeTab === 'movements' && (
            <StockMovementsView
              movements={movements}
              onOpenQuickMutation={openQuickMutation}
              onPrintDeliveryNote={openDeliveryNote}
            />
          )}

          {activeTab === 'products' && (
            <ProductManagementView
              items={items}
              onAddProduct={openAddProduct}
              onEditProduct={openEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onViewBarcode={openBarcodeView}
              onExportCSV={handleExportCSV}
              onImportCSV={handleImportCSV}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              items={items}
              onAddSupplier={handleAddSupplier}
              onEditSupplier={handleEditSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pengaturan Sistem Inventaris</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfigurasi aturan restock otomatis, batas minimum ambang alert, dan preferensi gudang.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="font-bold text-slate-800">Model AI Laporan Otomatis Bulanan</div>
                  <p className="text-slate-500 text-[11px]">
                    Sistem terintegrasi dengan Google Gemini 2.5 Flash melalui endpoint server Express terenkripsi untuk kalkulasi inventory turnover, identifikasi dead-stock, dan rekomendasi restock cerdas.
                  </p>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <StockMutationModal
        isOpen={isMutationModalOpen}
        onClose={() => setIsMutationModalOpen(false)}
        items={items}
        locations={locations}
        initialType={mutationType}
        initialItem={selectedMutationItem}
        onSubmit={handleRecordMutation}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        suppliers={suppliers}
        locations={locations}
        onSave={handleSaveProduct}
      />

      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        items={items}
        activeItem={selectedBarcodeItem}
        onSelectItem={(item) => setSelectedBarcodeItem(item)}
        onQuickMutate={(type, item) => openQuickMutation(type, item)}
      />

      <DeliveryNoteModal
        isOpen={isDeliveryNoteOpen}
        onClose={() => setIsDeliveryNoteOpen(false)}
        movement={selectedMovementDoc}
      />
    </div>
  );
}
