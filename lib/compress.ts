import { OutputFormat } from "@/types";

export interface CompressOptions {
  imageUrl: string;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number; // 1-100
}

export interface CompressResult {
  blob: Blob;
  url: string;
}

export function compressImage(
  options: CompressOptions,
  signal?: AbortSignal
): Promise<CompressResult> {
  const { imageUrl, width, height, format, quality } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const qualityParam = format === "image/png" ? undefined : quality / 100;

      canvas.toBlob(
        (blob) => {
          if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }

          if (!blob) {
            reject(new Error("Compression produced no output"));
            return;
          }

          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        },
        format,
        qualityParam
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    img.src = imageUrl;
  });
}
