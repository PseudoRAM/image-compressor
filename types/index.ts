export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export interface CompressionSettings {
  quality: number; // 1-100
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  format: OutputFormat;
}

export interface ImageState {
  originalFile: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  isCompressing: boolean;
}

export interface HistoryEntry {
  settings: CompressionSettings;
}
