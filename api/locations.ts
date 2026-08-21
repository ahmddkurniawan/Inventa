import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('locations').select('*');
    if (error) return res.status(500).json({ error: error.message });

    // Fallback to initial if db is empty (for demo purposes)
    if (!data || data.length === 0) {
      return res.status(200).json([
        { id: 'LOC-1', name: 'Gudang Utama Makassar', type: 'warehouse', capacity: 10000, status: 'active', manager: 'Andi M.' }
      ]);
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
