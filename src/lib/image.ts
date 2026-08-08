// ── Client-side image validation + resize ── //

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION = 1920; // resize if larger

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file on the client side before upload
 */
export function validateImageFile(file: File): ValidationResult {
  // Check MIME type
  const mime = file.type.toLowerCase();
  if (!ACCEPTED_TYPES.includes(mime)) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    // Some phones don't set proper MIME — check extension as fallback
    if (ext && !["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return {
        valid: false,
        error: `Invalid format (.${ext}). Only JPG, PNG, and WebP images are accepted.`,
      };
    }
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is ${mb}MB. Maximum allowed size is 10MB.`,
    };
  }

  return { valid: true };
}

/**
 * Resize an image client-side if it exceeds the max dimension.
 * Returns a base64 string ready for upload.
 * Uses HTML Canvas API — runs in the browser.
 */
export async function optimizeImage(file: File): Promise<{ base64: string; thumbnail: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Resize if needed
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_IMAGE_DIMENSION);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_IMAGE_DIMENSION);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      // Full-size version for API (JPEG 85%)
      const mainCanvas = document.createElement("canvas");
      mainCanvas.width = width;
      mainCanvas.height = height;
      const mainCtx = mainCanvas.getContext("2d")!;
      mainCtx.drawImage(img, 0, 0, width, height);
      const base64 = mainCanvas.toDataURL("image/jpeg", 0.85);

      // Thumbnail version (150px wide, JPEG 60%)
      const thumbCanvas = document.createElement("canvas");
      const thumbW = 150;
      const thumbH = Math.round((height / width) * 150);
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const thumbCtx = thumbCanvas.getContext("2d")!;
      thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
      const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.6);

      resolve({ base64, thumbnail });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for optimization"));
    };

    img.src = url;
  });
}