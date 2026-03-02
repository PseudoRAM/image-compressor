"use client";

import { useState, useCallback, useRef } from "react";
import { CompressionSettings, ImageState, OutputFormat } from "@/types";
import { getMimeType, getExtension } from "@/lib/format-utils";
import { loadImageFromFile } from "@/lib/image-loader";
import { CompressResult } from "@/lib/compress";
import { useUndoHistory } from "./use-undo-history";
import { useDebouncedCompression } from "./use-debounced-compression";

const DEFAULT_SETTINGS: CompressionSettings = {
  quality: 80,
  width: 0,
  height: 0,
  maintainAspectRatio: true,
  format: "image/jpeg",
};

export function useImageCompressor() {
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aspectRatioRef = useRef<number>(1);

  const {
    current: settings,
    push: pushSettings,
    set: setSettings,
    undo: undoSettings,
    clear: clearSettings,
    canUndo,
  } = useUndoHistory<CompressionSettings>(DEFAULT_SETTINGS);

  const revokeCompressedUrl = useCallback(() => {
    if (imageState?.compressedUrl) {
      URL.revokeObjectURL(imageState.compressedUrl);
    }
  }, [imageState?.compressedUrl]);

  useDebouncedCompression({
    originalUrl: imageState?.originalUrl ?? null,
    settings,
    onStart: () => {
      setImageState((prev) => (prev ? { ...prev, isCompressing: true } : prev));
    },
    onComplete: (result: CompressResult) => {
      revokeCompressedUrl();
      setImageState((prev) =>
        prev
          ? {
              ...prev,
              compressedBlob: result.blob,
              compressedUrl: result.url,
              isCompressing: false,
            }
          : prev
      );
    },
    onError: (err: Error) => {
      setError(err.message);
      setImageState((prev) => (prev ? { ...prev, isCompressing: false } : prev));
    },
  });

  const handleFileSelected = useCallback(
    async (file: File) => {
      setError(null);

      // Revoke old URLs
      if (imageState?.originalUrl) {
        URL.revokeObjectURL(imageState.originalUrl);
      }
      revokeCompressedUrl();

      try {
        const loaded = await loadImageFromFile(file);
        const url = URL.createObjectURL(file);
        const format = getMimeType(file);
        aspectRatioRef.current = loaded.width / loaded.height;

        const newSettings: CompressionSettings = {
          ...DEFAULT_SETTINGS,
          width: loaded.width,
          height: loaded.height,
          format,
        };

        clearSettings(newSettings);

        setImageState({
          originalFile: file,
          originalUrl: url,
          originalWidth: loaded.width,
          originalHeight: loaded.height,
          compressedBlob: null,
          compressedUrl: null,
          isCompressing: true,
        });
      } catch {
        setError("Failed to load image. Please try a different file.");
      }
    },
    [imageState?.originalUrl, revokeCompressedUrl, clearSettings]
  );

  const updateSettings = useCallback(
    (partial: Partial<CompressionSettings>) => {
      const next = { ...settings, ...partial };

      // Handle aspect ratio locking
      if (next.maintainAspectRatio && imageState) {
        if (partial.width !== undefined && partial.width !== settings.width) {
          next.height = Math.round(partial.width / aspectRatioRef.current);
        } else if (partial.height !== undefined && partial.height !== settings.height) {
          next.width = Math.round(partial.height * aspectRatioRef.current);
        }
      }

      pushSettings(next);
    },
    [settings, imageState, pushSettings]
  );

  const handleDownload = useCallback(() => {
    if (!imageState?.compressedUrl || !imageState.compressedBlob) return;

    const ext = getExtension(settings.format);
    const baseName =
      imageState.originalFile.name.replace(/\.[^.]+$/, "") || "compressed";
    const fileName = `${baseName}-compressed.${ext}`;

    const a = document.createElement("a");
    a.href = imageState.compressedUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [imageState, settings.format]);

  const handleClear = useCallback(() => {
    if (imageState?.originalUrl) {
      URL.revokeObjectURL(imageState.originalUrl);
    }
    revokeCompressedUrl();
    setImageState(null);
    clearSettings(DEFAULT_SETTINGS);
    setError(null);
  }, [imageState?.originalUrl, revokeCompressedUrl, clearSettings]);

  const handleUndo = useCallback(() => {
    undoSettings();
  }, [undoSettings]);

  return {
    imageState,
    settings,
    error,
    canUndo,
    handleFileSelected,
    updateSettings,
    handleDownload,
    handleClear,
    handleUndo,
  };
}
