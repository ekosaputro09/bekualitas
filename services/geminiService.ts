import { GoogleGenAI } from "@google/genai";
import { MenuItem } from "../types";

// Initialize Gemini Client
// Always use named parameter for apiKey and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingCopy = async (menuItems: MenuItem[]): Promise<string> => {
  // Hanya ambil menu yang aktif
  const activeItems = menuItems.filter(item => item.isActive);

  if (!activeItems || activeItems.length === 0) {
    return "Tidak ada menu aktif. Silakan aktifkan menu terlebih dahulu untuk membuat promosi.";
  }

  const menuList = activeItems
    .map(item => `- ${item.name} (Stok: ${item.stock}, Rp ${item.price.toLocaleString('id-ID')})`)
    .join('\n');

  const prompt = `
    Saya menjual frozen food secara pre-order (PO).
    Tolong buatkan caption broadcast WhatsApp yang menarik, ramah, dan menggugah selera untuk customer saya.
    Gunakan emoji yang sesuai.
    
    Berikut adalah menu yang tersedia saat ini:
    ${menuList}

    Format pesan:
    1. Judul menarik (contoh: "PO Frozen Food Dibuka! 📢")
    2. Kata pengantar singkat yang ramah.
    3. Daftar menu beserta harga.
    4. Call to Action (ajakan membeli).
    5. Penutup.
    
    Buat dalam Bahasa Indonesia yang santai tapi sopan.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Use property access for text, not method call.
    // response.text is a getter in GenerateContentResponse.
    return response.text || "Gagal membuat konten marketing.";
  } catch (error) {
    console.error("Error generating marketing copy:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI. Pastikan koneksi internet lancar.";
  }
};