import { OutputFormat } from "@/types";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getMimeType(file: File): OutputFormat {
  const type = file.type;
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

export function getExtension(format: OutputFormat): string {
  switch (format) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

export function getFormatLabel(format: OutputFormat): string {
  switch (format) {
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WebP";
    case "image/jpeg":
    default:
      return "JPEG";
  }
}
