import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('items').select('*').order('last_updated', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    // Map database snake_case to frontend camelCase
    const mapped = (data || []).map(item => ({
      ...item,
      costPrice: Number(item.cost_price),
      sellingPrice: item.selling_price ? Number(item.selling_price) : undefined,
      currentStock: item.current_stock,
      minStock: item.min_stock,
      maxStock: item.max_stock,
      supplierName: item.supplier_name,
      lastUpdated: item.last_updated,
      totalSoldThisMonth: item.total_sold_this_month
    }));

    return res.status(200).json(mapped);
  }

  if (req.method === 'POST') {
    const items = req.body || [];
    
    // Map frontend camelCase to database snake_case
    const dbItems = items.map((item: any) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      description: item.description,
      unit: item.unit,
      cost_price: item.costPrice,
      selling_price: item.sellingPrice,
      current_stock: item.currentStock,
      min_stock: item.minStock,
      max_stock: item.maxStock,
      location: item.location,
      status: item.status,
      supplier_name: item.supplierName,
      last_updated: item.lastUpdated || new Date().toISOString(),
      total_sold_this_month: item.totalSoldThisMonth || 0
    }));

    // Perform Upsert
    if (dbItems.length > 0) {
      const { error: upsertError } = await supabase.from('items').upsert(dbItems);
      if (upsertError) return res.status(500).json({ error: upsertError.message });
    }

    // Delete items not in the list to mimic "replace all"
    const ids = items.map((i: any) => i.id);
    if (ids.length > 0) {
      await supabase.from('items').delete().not('id', 'in', `(${ids.map((id:string)=>`"${id}"`).join(',')})`);
    } else {
       await supabase.from('items').delete().neq('id', 'dummy');
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
