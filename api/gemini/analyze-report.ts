import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period, summary, fastMoving, lowStock, totalValuation, categoryBreakdown } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        success: true,
        isFallback: true,
        analysis: {
          executiveSummary: `Laporan inventaris periode ${period || "Bulan Ini"} menunjukkan kondisi perputaran stok yang terkontrol dengan total valuasi aset Rp ${(totalValuation || 0).toLocaleString("id-ID")}. Terdapat ${lowStock?.length || 0} item dengan stok kritis yang memerlukan perhatian pengadaan segera.`,
          keyInsights: [
            `Total barang masuk dan keluar mempertahankan rasio perputaran (turnover) yang seimbang.`,
            `Item terlaris (Fast Moving) dipimpin oleh kategori yang memiliki permintaan stabil.`,
            `Rekomendasi tindakan: Lakukan reorder segera untuk item di bawah ambang batas minimum.`
          ],
          restockRecommendations: (lowStock || []).slice(0, 5).map((item: any) => ({
            sku: item.sku,
            name: item.name,
            currentStock: item.currentStock,
            minStock: item.minStock,
            recommendedQty: Math.max((item.minStock * 2) - item.currentStock, item.minStock),
            urgency: item.currentStock === 0 ? "Kritis (Habis)" : "Tinggi (Menipis)",
            estimatedCost: ((Math.max((item.minStock * 2) - item.currentStock, item.minStock)) * (item.costPrice || 0))
          }))
        }
      });
    }

    const prompt = `
Anda adalah Sistem Pakar Analisis Inventaris (INVENTA).
Analisis laporan bulanan berikut dan berikan:
1. "executiveSummary": Ringkasan eksekutif maksimal 3 kalimat mengenai kesehatan inventaris.
2. "keyInsights": 3-4 poin insight penting mengenai pergerakan barang.
3. "restockRecommendations": Array objek untuk 5 barang paling kritis yang harus di-restock (sku, name, currentStock, minStock, recommendedQty, urgency (Kritis/Tinggi/Menengah), estimatedCost).

Data Laporan:
Periode: ${period}
Valuasi Tutup Buku: Rp ${totalValuation}
Rasio Turnover: ${summary.turnoverRatio}
Fast Moving Items: ${JSON.stringify(fastMoving.slice(0, 3))}
Low Stock Items: ${JSON.stringify(lowStock)}
Kategori: ${JSON.stringify(categoryBreakdown)}

Format output harus valid JSON tanpa markdown formatting tambahan. 
Struktur JSON:
{
  "executiveSummary": "...",
  "keyInsights": ["...", "..."],
  "restockRecommendations": [
    { "sku": "...", "name": "...", "currentStock": 0, "minStock": 0, "recommendedQty": 0, "urgency": "...", "estimatedCost": 0 }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    const rawResponse = response.text;
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(rawResponse || "{}");
    } catch (e) {
      console.warn("Failed to parse Gemini JSON:", e);
      parsedAnalysis = null;
    }

    if (parsedAnalysis) {
      return res.status(200).json({ success: true, analysis: parsedAnalysis });
    } else {
      throw new Error("Invalid format from AI");
    }

  } catch (err: any) {
    console.error("AI Analysis API Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
