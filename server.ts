import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK lazily
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

import { readDB, writeDB } from './src/server/db';

// Health check API
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database API Endpoints
app.get("/api/items", async (_req, res) => {
  const db = await readDB();
  res.json(db.items);
});
app.post("/api/items", async (req, res) => {
  const db = await readDB();
  db.items = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get("/api/movements", async (_req, res) => {
  const db = await readDB();
  res.json(db.movements);
});
app.post("/api/movements", async (req, res) => {
  const db = await readDB();
  db.movements = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get("/api/suppliers", async (_req, res) => {
  const db = await readDB();
  res.json(db.suppliers);
});
app.post("/api/suppliers", async (req, res) => {
  const db = await readDB();
  db.suppliers = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get("/api/locations", async (_req, res) => {
  const db = await readDB();
  res.json(db.locations);
});

// AI Monthly Inventory Analysis & Recommendation API
app.post("/api/gemini/analyze-report", async (req, res) => {
  try {
    const { period, summary, fastMoving, lowStock, totalValuation, categoryBreakdown } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
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
          })),
          efficiencyScore: 88,
          healthStatus: "Sehat (Optimal)"
        }
      });
    }

    const prompt = `Anda adalah Lead Inventory & Supply Chain Analyst profesional. Analisis data inventaris berikut untuk periode ${period || "Bulan Ini"}:
Data Ringkasan:
- Total Valuasi Aset: Rp ${totalValuation}
- Ringkasan Mutasi: ${JSON.stringify(summary)}
- Item Terlaris (Fast Moving): ${JSON.stringify(fastMoving)}
- Item Stok Kritis/Menipis: ${JSON.stringify(lowStock)}
- Distribusi Kategori: ${JSON.stringify(categoryBreakdown)}

Berikan analisis mendalam dalam bahasa Indonesia dengan format JSON valid persis berikut:
{
  "executiveSummary": "Ringkasan eksekutif profesional 2-3 kalimat mengenai kesehatan inventaris, perputaran stok, dan risiko operasional",
  "keyInsights": [
    "Poin temuan kunci 1 (tren perputaran/keluar-masuk)",
    "Poin temuan kunci 2 (kategori paling dominan dan efisiensi modal)",
    "Poin temuan kunci 3 (analisis risiko stok mati / deadstock atau overstock)"
  ],
  "restockRecommendations": [
    {
      "sku": "SKU-xxx",
      "name": "Nama Produk",
      "currentStock": 0,
      "minStock": 10,
      "recommendedQty": 20,
      "urgency": "Kritis (Habis) / Tinggi (Menipis) / Sedang",
      "estimatedCost": 1500000,
      "reason": "Alasan singkat rekomendasi restock"
    }
  ],
  "efficiencyScore": 92,
  "healthStatus": "Sangat Sehat / Sehat (Optimal) / Perlu Perhatian / Kritis"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);

    res.json({
      success: true,
      analysis: parsed,
    });
  } catch (error: any) {
    console.error("Gemini report analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate report analysis",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Inventory Management Server running on port ${PORT}`);
  });
}

startServer();
