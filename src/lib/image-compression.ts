/**
 * Client-side image compression utility.
 * Converts images to WebP format and compresses them before uploading to S3.
 * Uses the browser's built-in Canvas API — no external dependencies needed.
 */

interface CompressOptions {
  /** Maximum width in pixels. Height is scaled proportionally. Default: 1920 */
  maxWidth?: number
  /** Maximum height in pixels. Width is scaled proportionally. Default: 1080 */
  maxHeight?: number
  /** WebP quality, 0–1. Default: 0.82 (good balance of quality and size) */
  quality?: number
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.82,
}

/**
 * Load an image File into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Gagal memuat gambar untuk kompresi"))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate the scaled dimensions while maintaining the aspect ratio.
 */
function scaledDimensions(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  let width = srcW
  let height = srcH

  if (width > maxW) {
    height = Math.round(height * (maxW / width))
    width = maxW
  }
  if (height > maxH) {
    width = Math.round(width * (maxH / height))
    height = maxH
  }

  return { width, height }
}

/**
 * Compress and convert an image File to WebP format.
 *
 * Returns a new File object with:
 * - Format: WebP
 * - Resized if exceeds maxWidth/maxHeight (maintains aspect ratio)
 * - Compressed to the specified quality
 *
 * If the browser doesn't support WebP canvas export, falls back to JPEG.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth, maxHeight, quality } = { ...DEFAULTS, ...options }

  // Skip compression for files that are already small (< 100KB)
  if (file.size < 100 * 1024) {
    return file
  }

  const img = await loadImage(file)

  const { width, height } = scaledDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth,
    maxHeight
  )

  // Draw to canvas at the target dimensions
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    // Canvas not available (e.g. SSR), return original
    return file
  }

  ctx.drawImage(img, 0, 0, width, height)

  // Try WebP first, fall back to JPEG
  const mimeType = canvas.toDataURL("image/webp").startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg"

  const extension = mimeType === "image/webp" ? ".webp" : ".jpg"

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })

  if (!blob) {
    // toBlob failed, return original
    return file
  }

  // Build the new filename: strip the old extension, add .webp
  const baseName = file.name.replace(/\.[^.]+$/, "")
  const newFileName = `${baseName}${extension}`

  const compressedFile = new File([blob], newFileName, { type: mimeType })

  // Only use the compressed version if it's actually smaller
  if (compressedFile.size >= file.size) {
    return file
  }

  return compressedFile
}

/**
 * Check if a file is an image that can be compressed.
 */
export function isCompressibleImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/bmp"].includes(
    file.type
  )
}
