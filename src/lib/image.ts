// ── Client-side image validation + resize + EXIF auto-rotate ── //

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
 * Decode an image and apply its EXIF orientation so the resulting
 * canvas pixels are right-side up.
 *
 * Uses createImageBitmap with imageOrientation: "from-image" when
 * available (modern Chromium/WebKit/Firefox). Falls back to drawing
 * the raw <img> onto a canvas and rotating it based on the EXIF tag.
 */
async function loadOriented(file: File): Promise<HTMLImageElement> {
  // Fast path: modern browsers respect the EXIF tag natively
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const img = new Image();
      img.width = bitmap.width;
      img.height = bitmap.height;
      // Expose the bitmap's pixels by drawing it onto a temp canvas
      // and serialising as a data URL — createImageBitmap doesn't give
      // us a drawable HTMLImageElement directly across all browsers.
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close?.();
      img.src = canvas.toDataURL("image/jpeg", 0.95);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to decode oriented image"));
      });
      return img;
    } catch {
      // fall through to legacy path
    }
  }

  // Fallback: load via <img> and let the caller manually rotate if needed
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Read the EXIF orientation tag (1–8) from a JPEG file's raw bytes.
 * Returns 1 (no rotation) if missing or unreadable.
 */
async function readExifOrientation(file: File): Promise<number> {
  if (file.type !== "image/jpeg") return 1;
  try {
    const buf = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return 1;
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) return 1;
      const marker = buf[offset + 1];
      // SOFn or EOI → orientation is before this
      if (marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        return 1;
      }
      // APP1 (EXIF)
      if (marker === 0xe1) {
        const segLen = (buf[offset + 2] << 8) | buf[offset + 3];
        // "Exif\0\0"
        if (
          buf[offset + 4] === 0x45 && buf[offset + 5] === 0x78 &&
          buf[offset + 6] === 0x69 && buf[offset + 7] === 0x66
        ) {
          const tiffStart = offset + 10;
          // byte order
          const little =
            buf[tiffStart] === 0x49 && buf[tiffStart + 1] === 0x49;
          const get16 = (p: number) =>
            little ? buf[p] | (buf[p + 1] << 8) : (buf[p] << 8) | buf[p + 1];
          const get32 = (p: number) =>
            little
              ? buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16) | (buf[p + 3] << 24)
              : (buf[p] << 24) | (buf[p + 1] << 16) | (buf[p + 2] << 8) | buf[p + 3];
          if (get16(tiffStart + 2) !== 0x002a) return 1;
          const ifd0 = tiffStart + get32(tiffStart + 4);
          const numEntries = get16(ifd0);
          for (let i = 0; i < numEntries; i++) {
            const entry = ifd0 + 2 + i * 12;
            const tag = get16(entry);
            if (tag === 0x0112) {
              // Orientation
              return get16(entry + 8);
            }
          }
        }
        return 1;
      }
      // Skip other segments by length
      const segLen = (buf[offset + 2] << 8) | buf[offset + 3];
      offset += 2 + segLen;
    }
  } catch {
    /* ignore */
  }
  return 1;
}

/**
 * Resize + EXIF-rotate + thumbnail in one pass.
 * Always returns right-side-up pixels.
 */
export async function optimizeImage(file: File): Promise<{ base64: string; thumbnail: string }> {
  // Try the fast path first
  try {
    const img = await loadOriented(file);
    return drawResized(img);
  } catch {
    // legacy fallback: read EXIF manually and rotate
    const orientation = await readExifOrientation(file);
    const legacy = await loadLegacy(file);
    const rotated = orientation === 1 ? legacy : rotateByOrientation(legacy, orientation);
    return drawResized(rotated);
  }
}

function loadLegacy(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for optimization"));
    };
    img.src = url;
  });
}

function rotateByOrientation(img: HTMLImageElement, orientation: number): HTMLCanvasElement {
  const swap = orientation >= 5 && orientation <= 8;
  const w = swap ? img.height : img.width;
  const h = swap ? img.width : img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  switch (orientation) {
    case 2: ctx.translate(w, 0); ctx.scale(-1, 1); break;
    case 3: ctx.translate(w, h); ctx.scale(-1, -1); break;
    case 4: ctx.translate(0, h); ctx.scale(1, -1); break;
    case 5: ctx.rotate(90 * Math.PI / 180); ctx.scale(1, -1); break;
    case 6: ctx.rotate(90 * Math.PI / 180); ctx.translate(0, -h); break;
    case 7: ctx.rotate(90 * Math.PI / 180); ctx.translate(w, -h); ctx.scale(-1, 1); break;
    case 8: ctx.rotate(-90 * Math.PI / 180); ctx.translate(-w, 0); break;
  }
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function drawResized(source: HTMLImageElement | HTMLCanvasElement): { base64: string; thumbnail: string } {
  let width = source.width;
  let height = source.height;

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
  mainCtx.drawImage(source, 0, 0, width, height);
  const base64 = mainCanvas.toDataURL("image/jpeg", 0.85);

  // Thumbnail version (150px wide, JPEG 60%)
  const thumbCanvas = document.createElement("canvas");
  const thumbW = 150;
  const thumbH = Math.round((height / width) * 150);
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext("2d")!;
  thumbCtx.drawImage(source, 0, 0, thumbW, thumbH);
  const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.6);

  return { base64, thumbnail };
}
