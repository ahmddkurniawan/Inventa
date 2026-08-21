import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const mapped = (data || []).map(s => ({
      ...s,
      contactPerson: s.contact_person
    }));

    return res.status(200).json(mapped);
  }

  if (req.method === 'POST') {
    const suppliers = req.body || [];
    
    const dbSuppliers = suppliers.map((s: any) => ({
      id: s.id,
      name: s.name,
      contact_person: s.contactPerson,
      email: s.email,
      phone: s.phone,
      address: s.address,
      category: s.category,
      status: s.status,
      rating: s.rating
    }));

    if (dbSuppliers.length > 0) {
      const { error: upsertError } = await supabase.from('suppliers').upsert(dbSuppliers);
      if (upsertError) return res.status(500).json({ error: upsertError.message });
    }

    const ids = suppliers.map((i: any) => i.id);
    if (ids.length > 0) {
      await supabase.from('suppliers').delete().not('id', 'in', `(${ids.map((id:string)=>`"${id}"`).join(',')})`);
    } else {
       await supabase.from('suppliers').delete().neq('id', 'dummy');
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
