// ── Server-side image validation (magic bytes check) ── //

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ServerValidationResult {
  valid: boolean;
  mimeType?: string;
  error?: string;
  suggestion?: string;
}

/**
 * Server-side validation: check actual file type via magic bytes,
 * not just trusting the file extension or MIME header.
 * Prevents a PDF renamed to .jpg from being sent to Gemini.
 */
export function validateImageOnServer(
  buffer: Buffer,
  declaredType: string
): ServerValidationResult {
  // Check size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is ${(buffer.length / (1024 * 1024)).toFixed(1)}MB. Maximum is 10MB.`,
      suggestion: "Please resize the image before uploading.",
    };
  }

  if (buffer.length < 12) {
    return {
      valid: false,
      error: "File is too small to be a valid image.",
      suggestion: "The file may be corrupted or empty.",
    };
  }

  // Check magic bytes
  let detectedType: string | null = null;

  for (const [mime, bytes] of Object.entries(MAGIC_BYTES)) {
    const matches = bytes.every((b, i) => buffer[i] === b);
    if (matches) {
      detectedType = mime;
      break;
    }
  }

  // WebP check: RIFF .... WEBP at offset 8
  if (!detectedType && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    detectedType = "image/webp";
  }

  if (!detectedType) {
    return {
      valid: false,
      error: "File is not a valid JPG, PNG, or WebP image.",
      suggestion:
        "Please upload only photos of the forms. PDFs, documents, or other files are not supported.",
    };
  }

  // Warn if declared type doesn't match actual type (but still accept it)
  if (declaredType && detectedType !== declaredType) {
    // Not a hard error — some phones set wrong MIME
    console.warn(
      `MIME mismatch: declared ${declaredType}, actual ${detectedType}`
    );
  }

  return { valid: true, mimeType: detectedType };
}