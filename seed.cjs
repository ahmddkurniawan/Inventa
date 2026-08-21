const fs = require('fs');

const rawData = [
  { desc: 'HEAVY 16s', size: 'S', color: 'Black', in: 40, out: 14, inv: 26, price: 63000 },
  { desc: 'HEAVY 16s', size: 'M', color: 'Black', in: 80, out: 2, inv: 78, price: 63000 },
  { desc: 'HEAVY 16s', size: 'L', color: 'Black', in: 80, out: 4, inv: 76, price: 65000 },
  { desc: 'HEAVY 16s', size: 'XL', color: 'Black', in: 40, out: 5, inv: 35, price: 71000 },
  { desc: 'HEAVY 16s', size: 'XXL', color: 'Black', in: 0, out: 6, inv: -6, price: 71000 },
  { desc: 'HEAVY 16s', size: 'S', color: 'White', in: 4, out: 6, inv: -2, price: 63000 },
  { desc: 'HEAVY 16s', size: 'M', color: 'White', in: 8, out: 0, inv: 8, price: 63000 },
  { desc: 'HEAVY 16s', size: 'L', color: 'White', in: 8, out: 0, inv: 8, price: 65000 },
  { desc: 'HEAVY 16s', size: 'XL', color: 'White', in: 4, out: 0, inv: 4, price: 71000 },
  { desc: 'HEAVY 16s', size: 'XXL', color: 'White', in: 0, out: 0, inv: 0, price: 71000 },
  { desc: 'HEAVY 16s', size: 'S', color: 'Navy', in: 2, out: 0, inv: 2, price: 63000 },
  { desc: 'HEAVY 16s', size: 'M', color: 'Navy', in: 4, out: 0, inv: 4, price: 63000 },
  { desc: 'HEAVY 16s', size: 'L', color: 'Navy', in: 4, out: 0, inv: 4, price: 65000 },
  { desc: 'HEAVY 16s', size: 'XL', color: 'Navy', in: 2, out: 0, inv: 2, price: 71000 },
  { desc: 'HEAVY 16s', size: 'XXL', color: 'Navy', in: 0, out: 0, inv: 0, price: 71000 },
  { desc: 'HEAVY 16s', size: 'S', color: 'Green', in: 2, out: 0, inv: 2, price: 63000 },
  { desc: 'HEAVY 16s', size: 'M', color: 'Green', in: 4, out: 0, inv: 4, price: 63000 },
  { desc: 'HEAVY 16s', size: 'L', color: 'Green', in: 4, out: 0, inv: 4, price: 65000 },
  { desc: 'HEAVY 16s', size: 'XL', color: 'Green', in: 2, out: 0, inv: 2, price: 71000 },
  { desc: 'HEAVY 16s', size: 'XXL', color: 'Green', in: 0, out: 0, inv: 0, price: 71000 },
  { desc: 'HEAVY 16s', size: 'S', color: 'Blue', in: 2, out: 0, inv: 2, price: 63000 },
  { desc: 'HEAVY 16s', size: 'M', color: 'Blue', in: 2, out: 2, inv: 0, price: 63000 },
  { desc: 'HEAVY 16s', size: 'L', color: 'Blue', in: 2, out: 2, inv: 0, price: 65000 },
  { desc: 'HEAVY 16s', size: 'XL', color: 'Blue', in: 2, out: 1, inv: 1, price: 71000 },
  { desc: 'HEAVY 16s', size: 'XXL', color: 'Blue', in: 0, out: 0, inv: 0, price: 71000 },
  { desc: 'all LS', size: 'L', color: 'Hitam', in: 1, out: 0, inv: 1, price: 63000 },
  { desc: 'all LS', size: 'L', color: 'Putih', in: 1, out: 0, inv: 1, price: 63000 },
  { desc: 'all LS', size: 'L', color: 'Green', in: 1, out: 0, inv: 1, price: 65000 },
  { desc: 'all LS', size: 'L', color: 'Navy', in: 1, out: 0, inv: 1, price: 71000 },
  { desc: 'all LS', size: 'L', color: 'Biru', in: 1, out: 0, inv: 1, price: 71000 },
];

const items = [];
const movements = [];
let itemCounter = 1;

rawData.forEach((row, index) => {
  const id = `ITEM-2026-${String(index + 1).padStart(3, '0')}`;
  const sku = `${row.desc.replace(/\s+/g, '').toUpperCase()}-${row.color.toUpperCase().substring(0, 3)}-${row.size}`;
  const name = `${row.desc} ${row.color} Size ${row.size}`;
  const category = row.desc === 'all LS' ? 'Long Sleeve' : 'Heavy 16s T-Shirt';

  // Handling negative inventory for the mock data by making it 0,
  // since this is just an initial seed and negative stock messes up calculations.
  const finalStock = Math.max(0, row.inv);

  items.push({
    id,
    sku,
    barcode: `899${Math.floor(100000 + Math.random() * 900000)}`,
    name,
    category,
    unit: 'Pcs',
    costPrice: Math.round(row.price * 0.7), // HPP is 70% of the selling price
    sellingPrice: row.price, // PDF price is the selling price
    currentStock: finalStock,
    minStock: 5,
    maxStock: 100,
    location: 'Gudang Makassar',
    supplierId: 'SUP-01',
    supplierName: 'PT Kaos Polos Indonesia',
    totalReceivedThisMonth: row.in,
    totalSoldThisMonth: row.out,
    status: finalStock <= 0 ? 'out_of_stock' : finalStock <= 5 ? 'low_stock' : 'in_stock',
    lastUpdated: new Date().toISOString()
  });

  if (row.in > 0) {
    movements.push({
      id: `MOV-IN-${Date.now()}-${index}`,
      referenceNumber: `PO-202608-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
      type: 'IN',
      itemId: id,
      itemSku: sku,
      itemName: name,
      itemCategory: category,
      quantity: row.in,
      unit: 'Pcs',
      unitCost: row.price,
      totalCost: row.in * row.price,
      previousStock: 0,
      newStock: row.in,
      sourceLocation: 'Supplier',
      destinationLocation: 'Gudang Makassar',
      operator: 'Admin',
      supplierOrRecipient: 'PT Kaos Polos Indonesia',
      notes: 'Penerimaan stok awal bulan'
    });
  }

  if (row.out > 0) {
    movements.push({
      id: `MOV-OUT-${Date.now()}-${index}`,
      referenceNumber: `DO-202608-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date(Date.now() - Math.random() * 2 * 86400000).toISOString(),
      type: 'OUT',
      itemId: id,
      itemSku: sku,
      itemName: name,
      itemCategory: category,
      quantity: row.out,
      unit: 'Pcs',
      unitCost: row.price,
      totalCost: row.out * row.price,
      previousStock: row.in,
      newStock: Math.max(0, row.in - row.out),
      sourceLocation: 'Gudang Makassar',
      operator: 'Admin',
      supplierOrRecipient: 'Customer Retail',
      notes: 'Penjualan'
    });
  }
});

let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

// Replace the arrays
content = content.replace(/export const INITIAL_ITEMS: InventoryItem\[\] = \[[\s\S]*?\];/, `export const INITIAL_ITEMS: InventoryItem[] = ${JSON.stringify(items, null, 2)};`);
content = content.replace(/export const INITIAL_MOVEMENTS: StockMovement\[\] = \[[\s\S]*?\];/, `export const INITIAL_MOVEMENTS: StockMovement[] = ${JSON.stringify(movements, null, 2)};`);

fs.writeFileSync('src/data/mockData.ts', content);
console.log('Seed data successfully written to mockData.ts');
