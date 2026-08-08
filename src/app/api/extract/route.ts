// ── POST /api/extract ── //
// Receives a form image, validates it, sends to Gemini AI, returns structured student data

import { NextRequest, NextResponse } from "next/server";
import { extractFromImage, parseClassSection, GeminiExtractionResult } from "@/lib/gemini";
import { validateImageOnServer } from "@/lib/validation-server";

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming JSON body
    let body: { imageBase64?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing imageBase64 field." },
        { status: 400 }
      );
    }

    // Extract the raw base64 data (strip the data:image/... prefix if present)
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    if (!base64Data || base64Data.length < 100) {
      return NextResponse.json(
        { success: false, error: "Image data is too small or empty." },
        { status: 400 }
      );
    }

    // Decode to buffer for validation
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, "base64");
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid base64 encoding." },
        { status: 400 }
      );
    }

    // Server-side validation — check magic bytes
    const validation = validateImageOnServer(buffer, "image/jpeg");
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          suggestion: validation.suggestion,
        },
        { status: 422 }
      );
    }

    // Send to Gemini for OCR extraction
    const extraction = await extractFromImage(imageBase64);

    if (!extraction.results || extraction.results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: extraction.error || "Failed to extract data from this image.",
          suggestion: "Please try again with a clearer, better-lit photo of the form.",
          retryAfter: extraction.retryAfter,
        },
        { status: extraction.retryAfter ? 429 : 422 }
      );
    }

    // Parse class-section for each student
    const data = extraction.results.map((r) => {
      const { className, sectionName } = parseClassSection(r.classSection);
      return {
        admissionNo: r.admissionNo,
        studentName: r.studentName,
        fatherName: r.fatherName,
        motherName: r.motherName,
        dob: r.dob,
        classSection: r.classSection,
        className,
        sectionName,
        mobileNumber: r.mobileNumber,
        address: r.address,
        confidence: r.confidence,
      };
    });

    // Return array of student data
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      retried: extraction.retried,
    });
  } catch (error: any) {
    console.error("/api/extract error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
// Allow up to 60s for Gemini API call
export const maxDuration = 60;