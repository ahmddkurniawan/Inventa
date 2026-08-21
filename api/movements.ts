import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('movements').select('*').order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const mapped = (data || []).map(m => ({
      ...m,
      itemId: m.item_id,
      itemSku: m.item_sku,
      itemName: m.item_name,
      itemCategory: m.item_category,
      unitCost: Number(m.unit_cost),
      totalCost: Number(m.total_cost),
      previousStock: m.previous_stock,
      newStock: m.new_stock,
      sourceLocation: m.source_location,
      destinationLocation: m.destination_location,
      supplierOrRecipient: m.supplier_or_recipient,
      referenceNumber: m.reference_number
    }));

    return res.status(200).json(mapped);
  }

  if (req.method === 'POST') {
    const movements = req.body || [];
    
    const dbMovements = movements.map((m: any) => ({
      id: m.id,
      type: m.type,
      timestamp: m.timestamp || new Date().toISOString(),
      item_id: m.itemId,
      item_sku: m.itemSku,
      item_name: m.itemName,
      item_category: m.itemCategory,
      quantity: m.quantity,
      unit: m.unit,
      unit_cost: m.unitCost,
      total_cost: m.totalCost,
      previous_stock: m.previousStock,
      new_stock: m.newStock,
      source_location: m.sourceLocation,
      destination_location: m.destinationLocation,
      operator: m.operator,
      supplier_or_recipient: m.supplierOrRecipient,
      reference_number: m.referenceNumber,
      notes: m.notes
    }));

    if (dbMovements.length > 0) {
      const { error: upsertError } = await supabase.from('movements').upsert(dbMovements);
      if (upsertError) return res.status(500).json({ error: upsertError.message });
    }

    const ids = movements.map((i: any) => i.id);
    if (ids.length > 0) {
      await supabase.from('movements').delete().not('id', 'in', `(${ids.map((id:string)=>`"${id}"`).join(',')})`);
    } else {
       await supabase.from('movements').delete().neq('id', 'dummy');
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
