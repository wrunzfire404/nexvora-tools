import { apiRequest } from "./api-client";
import { MAGNIFIC_ENDPOINTS } from "./constants";

/**
 * Detect if text is likely non-English.
 * Simple heuristic: check for non-ASCII characters common in other languages,
 * or use character frequency analysis.
 */
export function isLikelyNonEnglish(text: string): boolean {
  // Remove common English punctuation and numbers
  const cleaned = text.replace(/[0-9.,!?;:'"()\-\s]/g, "");
  if (!cleaned) return false;

  // Check for non-Latin characters (CJK, Arabic, Cyrillic, etc.)
  const nonLatinRegex = /[\u0400-\u04FF\u0600-\u06FF\u3000-\u9FFF\uAC00-\uD7AF\u0E00-\u0E7F]/;
  if (nonLatinRegex.test(cleaned)) return true;

  // Check for common Indonesian/Malay words
  const indonesianWords = [
    "yang", "dan", "di", "ini", "itu", "dengan", "untuk", "dari",
    "pada", "adalah", "ke", "tidak", "akan", "juga", "sudah",
    "buat", "bikin", "gambar", "wanita", "pria", "sedang", "lagi",
    "atas", "bawah", "kiri", "kanan", "depan", "belakang",
    "cantik", "tampan", "indah", "bagus", "besar", "kecil",
    "menatap", "duduk", "berdiri", "berjalan", "berlari",
    "langit", "laut", "gunung", "hutan", "sungai", "matahari",
    "malam", "siang", "pagi", "sore",
  ];

  const words = text.toLowerCase().split(/\s+/);
  const matchCount = words.filter((w) => indonesianWords.includes(w)).length;

  // If more than 30% of words match Indonesian vocabulary, likely non-English
  return matchCount / words.length > 0.3;
}

/**
 * Translate a prompt to English using Magnific's Improve Prompt API
 * with a translation-focused instruction prefix.
 */
export async function translatePromptToEnglish(
  prompt: string,
  apiKey: string
): Promise<{ translated: string; error?: string }> {
  // Prefix the prompt with translation instruction
  const translationPrompt = `Translate the following text to English for use as an AI image generation prompt. Keep it as a direct translation without adding extra details or embellishments. Only translate, do not improve or expand: "${prompt}"`;

  const response = await apiRequest<{ data: { prompt: string } }>(
    MAGNIFIC_ENDPOINTS["improve-prompt"],
    {
      method: "POST",
      body: { prompt: translationPrompt },
      apiKey,
      timeout: 15000,
    }
  );

  if (response.ok && response.data) {
    return { translated: response.data.data.prompt };
  }

  return { translated: prompt, error: response.error || "Translation failed" };
}
