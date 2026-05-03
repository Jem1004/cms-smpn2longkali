"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, X, Loader2, ImageIcon, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { compressImage, isCompressibleImage } from "@/lib/image-compression"
import type { PresignResult } from "@/types"

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void
  maxSizeMB?: number
  acceptedFormats?: string[]
  multiple?: boolean
  currentImageUrl?: string
}

const DEFAULT_MAX_SIZE_MB = 20
const DEFAULT_ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"]

const FORMAT_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
}

export function ImageUploader({
  onUploadComplete,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  multiple = false,
  currentImageUrl,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  function validateFile(file: File): string | null {
    if (!acceptedFormats.includes(file.type)) {
      const allowed = acceptedFormats.map((f) => FORMAT_LABELS[f] ?? f).join(", ")
      return `Format file tidak didukung. Gunakan ${allowed}.`
    }
    if (file.size > maxSizeBytes) {
      return `Ukuran file melebihi batas ${maxSizeMB}MB`
    }
    return null
  }

  async function uploadFile(file: File): Promise<string> {
    // 1. Compress image to WebP (client-side) before uploading
    let fileToUpload = file
    if (isCompressibleImage(file)) {
      try {
        fileToUpload = await compressImage(file)
        if (fileToUpload !== file) {
          const savedKB = Math.round((file.size - fileToUpload.size) / 1024)
          console.log(
            `[ImageUploader] Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(fileToUpload.size / 1024)}KB (hemat ${savedKB}KB)`
          )
        }
      } catch (err) {
        // If compression fails, proceed with original file
        console.warn("[ImageUploader] Kompresi gagal, gunakan file asli:", err)
        fileToUpload = file
      }
    }

    // 2. Request pre-signed URL
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: fileToUpload.name,
        contentType: fileToUpload.type,
        size: fileToUpload.size,
      }),
    })

    if (!presignRes.ok) {
      const body = await presignRes.json().catch(() => null)
      throw new Error(body?.error ?? "Gagal mendapatkan URL upload")
    }

    const { uploadUrl, fileUrl } = (await presignRes.json()) as PresignResult

    // 3. Upload compressed file directly to S3
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": fileToUpload.type },
      body: fileToUpload,
    })

    if (!uploadRes.ok) {
      throw new Error("Gagal mengunggah file. Silakan coba lagi.")
    }

    return fileUrl
  }

  async function handleFiles(files: FileList | File[]) {
    setError(null)
    const fileArray = Array.from(files)

    if (fileArray.length === 0) return

    // Validate all files first
    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setIsUploading(true)

    try {
      // Upload sequentially
      for (const file of fileArray) {
        const url = await uploadFile(file)
        if (!multiple) {
          setPreview(url)
        }
        onUploadComplete(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah file. Silakan coba lagi.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (isUploading) return

      const files = e.dataTransfer.files
      if (!multiple && files.length > 1) {
        setError("Hanya satu file yang diizinkan")
        return
      }
      handleFiles(files)
    },
    [isUploading, multiple]
  )

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function clearPreview() {
    setPreview(null)
    setError(null)
  }

  const acceptAttr = acceptedFormats.join(",")
  const formatLabels = acceptedFormats.map((f) => FORMAT_LABELS[f] ?? f).join(", ")

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview && !multiple && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-md border object-cover"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
            aria-label="Hapus gambar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-60"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label="Area upload gambar"
      >
        {isUploading ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Mengompresi & mengunggah...</p>
          </>
        ) : (
          <>
            {isDragOver ? (
              <ImageIcon className="mb-2 h-8 w-8 text-primary" />
            ) : (
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              {isDragOver ? "Lepaskan file di sini" : "Seret file ke sini atau klik untuk memilih"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatLabels} — Maks {maxSizeMB}MB
            </p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
