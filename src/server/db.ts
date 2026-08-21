import fs from 'fs/promises';
import path from 'path';
import { InventoryItem, StockMovement, Supplier, WarehouseLocation } from '../types';
import { INITIAL_ITEMS, INITIAL_LOCATIONS, INITIAL_MOVEMENTS, INITIAL_SUPPLIERS } from '../data/mockData';

export interface DatabaseSchema {
  items: InventoryItem[];
  movements: StockMovement[];
  suppliers: Supplier[];
  locations: WarehouseLocation[];
}

const DB_FILE = path.join(process.cwd(), 'database.json');

export async function readDB(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error: any) {
    // If file doesn't exist, create it with initial data
    if (error.code === 'ENOENT') {
      const initialData: DatabaseSchema = {
        items: INITIAL_ITEMS,
        movements: INITIAL_MOVEMENTS,
        suppliers: INITIAL_SUPPLIERS,
        locations: INITIAL_LOCATIONS,
      };
      await writeDB(initialData);
      return initialData;
    }
    throw error;
  }
}

export async function writeDB(data: DatabaseSchema): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
