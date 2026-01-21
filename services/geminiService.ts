
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, QuestionType, CognitiveLevel } from "../types";

/**
 * Helper untuk mendapatkan instance AI secara aman
 */
const getAIInstance = () => {
  const apiKey = import.meta.env.VITE_API_KEY || (window as any).process?.env?.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY tidak ditemukan. Pastikan Environment Variable sudah diatur di Vercel Dashboard.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAIImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Ilustrasi pendidikan untuk: "${prompt}". Gaya vektor flat, bersih, tanpa teks.` }],
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error: any) {
    console.error("AI Image Generation Error:", error);
    throw error;
  }
};

export const generateBatchAIQuestions = async (
  subject: Subject, 
  material: string, 
  count: number, 
  specificType: QuestionType | 'RANDOM',
  specificLevel: CognitiveLevel | 'RANDOM',
  fileData?: { data: string, mimeType: string },
  customPrompt?: string
) => {
  try {
    const ai = getAIInstance();
    
    const levelInstruction = specificLevel !== 'RANDOM' 
      ? `Semua soal HARUS memiliki level kognitif: ${specificLevel}.`
      : `Tentukan level kognitif (C1-C6) yang paling sesuai. Prioritaskan C4-C6 untuk soal analisis.`;

    let cleanBase64 = "";
    if (fileData) {
      cleanBase64 = fileData.data.includes("base64,") 
        ? fileData.data.split("base64,")[1] 
        : fileData.data;
    }

    const promptText = `Tugas: Buatkan ${count} soal ${subject} dalam bahasa Indonesia.
               ${material ? `Gunakan materi ini sebagai referensi: "${material}"` : 'Gunakan dokumen yang dilampirkan sebagai sumber materi utama.'}
               
               ${customPrompt ? `INSTRUKSI KHUSUS DARI GURU (WAJIB DIIKUTI): "${customPrompt}"` : ''}

               Tipe Soal: ${specificType !== 'RANDOM' ? specificType : 'Variasikan tipe soal'}
               Level Kognitif: ${levelInstruction}
               
               ATURAN FORMAT JAWABAN (correctAnswer):
               1. "${QuestionType.SINGLE}": Harus angka index (0-3).
               2. "${QuestionType.MULTIPLE}": Harus array angka index, misal [0, 2].
               3. "${QuestionType.COMPLEX_CATEGORY}": Harus array boolean [true, false, true, true] sesuai jumlah options.
               4. "${QuestionType.SHORT_ANSWER}": Harus string jawaban singkat.

               Hasilkan array JSON yang valid.`;

    const parts: any[] = [{ text: promptText }];

    if (fileData && cleanBase64) {
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: fileData.mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, enum: Object.values(QuestionType) },
              level: { type: Type.STRING, enum: Object.values(CognitiveLevel) },
              material: { type: Type.STRING },
              explanation: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING }
            },
            required: ["text", "type", "level", "material", "explanation", "options", "correctAnswer"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI memberikan respon kosong.");

    const raw = JSON.parse(responseText);
    
    return raw.map((q: any) => {
      let standardizedAnswer = q.correctAnswer;
      // Normalisasi jawaban berdasarkan tipe
      if (q.type === QuestionType.SINGLE) {
        standardizedAnswer = parseInt(String(q.correctAnswer), 10) || 0;
      } else if (q.type === QuestionType.MULTIPLE || q.type === QuestionType.COMPLEX_CATEGORY) {
        if (typeof q.correctAnswer === 'string') {
          try { standardizedAnswer = JSON.parse(q.correctAnswer); } catch { standardizedAnswer = []; }
        }
      }

      return { 
        ...q, 
        correctAnswer: standardizedAnswer, 
        subject, 
        isDeleted: false, 
        createdAt: Date.now() 
      };
    });
  } catch (error: any) {
    console.error("AI Question Generation Error:", error);
    throw error;
  }
};
