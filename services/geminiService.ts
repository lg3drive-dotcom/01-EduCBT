import { GoogleGenAI, Type } from "@google/genai";
import { Subject, QuestionType, CognitiveLevel } from "../types";

/**
 * Helper untuk mendapatkan instance AI secara aman (Vite)
 */
const getAIInstance = () => {
  const apiKey = import.meta.env.VITE_API_KEY;

  // Debug (hapus nanti kalau sudah fix)
  console.log("ENV:", import.meta.env);
  console.log("VITE_API_KEY:", apiKey);

  if (!apiKey) {
    throw new Error("VITE_API_KEY tidak ditemukan. Pastikan Environment Variable sudah diatur di Vercel Dashboard.");
  }

  return new GoogleGenAI({ apiKey });
};
