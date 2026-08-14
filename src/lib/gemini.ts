// ── Gemini AI Handwriting Extraction ── //

import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Please add it to .env.local or Vercel environment variables."
      );
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const EXTRACTION_PROMPT = `You are an expert at reading handwritten school enrollment forms.
Your job is to extract student information from ALL handwritten forms visible in this image.
The image may contain 1, 2, 3, or more individual student forms — find and extract EVERY one.

For EACH student you find, extract these fields:
1. admissionNo - Admission Number (e.g., "A-2026-001", "12345")
2. studentName - Full name of the student
3. fatherName - Father's full name
4. motherName - Mother's full name
5. dob - Date of birth in DD-MM-YYYY format (day-month-year)
6. classSection - Class and section combined (e.g., "I-A", "V-B", "X-C")
   - Class in Roman numerals (I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII) or digit (1, 2... 12)
   - Always prefer Roman numerals (5 → V, 10 → X)
   - Section as capital letter (A, B, C, D)
7. mobileNumber - Phone number(s). If two numbers, separate with comma and space (e.g., "9876543210, 9123456789")
8. address - Full address as written on the form

RULES:
- Extract ALL student forms in the image — if there are 3 forms visible, return 3 student objects
- If you cannot read a field clearly, write your best guess and mark confidence as "low"
- If a field is completely unreadable or missing, write "UNCLEAR"
- Always return ONLY valid JSON, nothing else. No markdown, no code blocks.
- For DOB: convert any format to DD-MM-YYYY (e.g., "15/3/2015" → "15-03-2015", "15 March 2015" → "15-03-2015")
- For class: always use Roman numerals (K.G. → "KG", nursery → "Nursery", 5th → "V", 10th → "X")
- For mobile: include country code only if written, otherwise just 10 digits
- Never make up data that isn't on the form

Respond ONLY with a JSON array — one object per student found in the image:
[
  {
    "admissionNo": "...",
    "studentName": "...",
    "fatherName": "...",
    "motherName": "...",
    "dob": "DD-MM-YYYY",
    "classSection": "X-A",
    "mobileNumber": "9876543210",
    "address": "...",
    "confidence": {
      "admissionNo": "high|medium|low",
      "studentName": "high|medium|low",
      "fatherName": "high|medium|low",
      "motherName": "high|medium|low",
      "dob": "high|medium|low",
      "classSection": "high|medium|low",
      "mobileNumber": "high|medium|low",
      "address": "high|medium|low"
    }
  }
]`;

export interface GeminiExtractionResult {
  admissionNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  classSection: string;
  mobileNumber: string;
  address: string;
  confidence: Record<string, "high" | "medium" | "low">;
}

/**
 * Parse the class-section string into class and section parts.
 * Handles: "V-B", "Nursery-A", "KG-B", "X-C", "12-B"
 */
export function parseClassSection(
  classSection: string
): { className: string; sectionName: string } {
  if (!classSection || classSection === "UNCLEAR") {
    return { className: "UNCLEAR", sectionName: "" };
  }

  // Try standard format: "V-B", "Nursery-A"
  const lastDash = classSection.lastIndexOf("-");
  if (lastDash > 0) {
    return {
      className: classSection.substring(0, lastDash).trim(),
      sectionName: classSection.substring(lastDash + 1).trim().toUpperCase(),
    };
  }

  // Try without dash: "VB", "5B"
  const match = classSection.match(/^([A-Za-z0-9]+)([A-Da-d])$/);
  if (match) {
    return {
      className: match[1].trim(),
      sectionName: match[2].toUpperCase(),
    };
  }

  // Can't parse — store as-is
  return { className: classSection, sectionName: "" };
}

/**
 * Extract student data from a form image using Gemini Vision API.
 * @param imageBase64 - Base64-encoded image (JPEG format, ~1920px)
 */
export async function extractFromImage(
  imageBase64: string
): Promise<{ results: GeminiExtractionResult[] | null; error?: string; retried: boolean; retryAfter?: number }> {
  const client = getClient();

  async function attempt(): Promise<{ results: GeminiExtractionResult[] | null; error?: string; retryAfter?: number }> {
    try {
      const response = await client.models.generateContent({
        // model: "gemini-3-flash-preview",
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              { text: EXTRACTION_PROMPT },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 2000, // increased for multiple students
          thinkingConfig: { thinkingBudget: 0 }, // disable thinking — just return JSON
        },
      });

      const text = response.text;
      if (!text || text.trim().length === 0) {
        return { results: null, error: "Gemini returned an empty response." };
      }

      console.log("[Gemini raw response]:", text.substring(0, 300));

      // Parse JSON from Gemini response
      let jsonStr = text.trim();
      jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "");
      jsonStr = jsonStr.replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "");

      // Try to extract JSON array or object if there's surrounding text
      let jsonMatch = jsonStr.match(/\[[\s\S]*"studentName"[\s\S]*\]/);
      if (!jsonMatch) {
        // Fallback: single object (old format / single student)
        jsonMatch = jsonStr.match(/\{[\s\S]*"studentName"[\s\S]*\}/);
      }
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      try {
        const parsed = JSON.parse(jsonStr);
        // Normalize: if single object, wrap in array
        const results = Array.isArray(parsed) ? parsed : [parsed];
        return { results };
      } catch (parseErr: any) {
        console.error("[Gemini parse error]:", parseErr.message, "| Raw:", jsonStr.substring(0, 150));
        return {
          results: null,
          error: "AI response could not be parsed. Please try again.",
        };
      }
    } catch (err: any) {
      const status = err?.status || err?.code;
      if (status === 429) {
        // Try to get retry-after from the error — SDK may attach it
        const retryAfter = err?.retryAfter || err?.headers?.["retry-after"] || 60;
        return {
          results: null,
          error: `AI is rate-limited. Retry in ${retryAfter}s.`,
          retryAfter: Number(retryAfter),
        };
      }
      if (status === 401 || status === 403) {
        return {
          results: null,
          error: "AI API key is invalid. Please check the configuration.",
        };
      }
      return {
        results: null,
        error: `AI service error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  // First attempt
  let response = await attempt();
  if (response.results) return { ...response, retried: false };

  // One retry
  console.warn("First Gemini attempt failed, retrying...");
  response = await attempt();
  return { ...response, retried: true };
}