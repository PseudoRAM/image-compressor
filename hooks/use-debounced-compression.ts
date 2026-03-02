import { useEffect, useRef } from "react";
import { compressImage, CompressResult } from "@/lib/compress";
import { CompressionSettings } from "@/types";

interface UseDebouncedCompressionOptions {
  originalUrl: string | null;
  settings: CompressionSettings;
  onStart: () => void;
  onComplete: (result: CompressResult) => void;
  onError: (error: Error) => void;
  delay?: number;
}

export function useDebouncedCompression({
  originalUrl,
  settings,
  onStart,
  onComplete,
  onError,
  delay = 300,
}: UseDebouncedCompressionOptions) {
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!originalUrl) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort previous compression
    if (abortRef.current) {
      abortRef.current.abort();
    }

    onStart();

    timeoutRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      compressImage(
        {
          imageUrl: originalUrl,
          width: settings.width,
          height: settings.height,
          format: settings.format,
          quality: settings.quality,
        },
        controller.signal
      )
        .then((result) => {
          if (!controller.signal.aborted) {
            onComplete(result);
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            onError(err);
          }
        });
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl, settings.width, settings.height, settings.format, settings.quality, delay]);
}
