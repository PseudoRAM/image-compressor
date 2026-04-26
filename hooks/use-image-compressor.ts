"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  CompressionSettings,
  ImageId,
  ImageEntry,
  MultiImageState,
} from "@/types";
import { getMimeType, getExtension } from "@/lib/format-utils";
import { loadImageFromFile } from "@/lib/image-loader";
import { compressImage, CompressResult } from "@/lib/compress";
import { useDebouncedCompression } from "./use-debounced-compression";

const DEFAULT_SETTINGS: CompressionSettings = {
  quality: 80,
  width: 0,
  height: 0,
  maintainAspectRatio: true,
  format: "image/jpeg",
};

const MAX_HISTORY = 50;

const EMPTY_STATE: MultiImageState = {
  images: {},
  order: [],
  selectedId: null,
};

let nextId = 0;
function generateId(): ImageId {
  return `img_${Date.now()}_${nextId++}`;
}

interface HistoryStack {
  entries: CompressionSettings[];
}

export function useImageCompressor() {
  const [state, setState] = useState<MultiImageState>(EMPTY_STATE);
  const [error, setError] = useState<string | null>(null);

  // Per-image undo histories — imperative ref since we can't call hooks in loops
  const historiesRef = useRef<Record<ImageId, HistoryStack>>({});

  const selected = state.selectedId ? state.images[state.selectedId] ?? null : null;
  const settings = selected?.settings ?? DEFAULT_SETTINGS;
  const imageCount = state.order.length;

  const canUndo =
    state.selectedId != null &&
    (historiesRef.current[state.selectedId]?.entries.length ?? 0) > 0;

  // Helper to update a single image entry
  const updateEntry = useCallback(
    (id: ImageId, updater: (entry: ImageEntry) => ImageEntry) => {
      setState((prev) => {
        const entry = prev.images[id];
        if (!entry) return prev;
        return {
          ...prev,
          images: { ...prev.images, [id]: updater(entry) },
        };
      });
    },
    []
  );

  // Build an ImageState-like view for the selected image to feed into useDebouncedCompression
  const selectedOriginalUrl = selected?.originalUrl ?? null;

  useDebouncedCompression({
    originalUrl: selectedOriginalUrl,
    settings,
    onStart: () => {
      if (!state.selectedId) return;
      const id = state.selectedId;
      updateEntry(id, (e) => ({ ...e, isCompressing: true }));
    },
    onComplete: (result: CompressResult) => {
      setState((prev) => {
        if (!prev.selectedId) return prev;
        const entry = prev.images[prev.selectedId];
        if (!entry) return prev;
        // Revoke old compressed URL
        if (entry.compressedUrl) {
          URL.revokeObjectURL(entry.compressedUrl);
        }
        return {
          ...prev,
          images: {
            ...prev.images,
            [prev.selectedId]: {
              ...entry,
              compressedBlob: result.blob,
              compressedUrl: result.url,
              isCompressing: false,
            },
          },
        };
      });
    },
    onError: (err: Error) => {
      setError(err.message);
      setState((prev) => {
        if (!prev.selectedId) return prev;
        const entry = prev.images[prev.selectedId];
        if (!entry) return prev;
        return {
          ...prev,
          images: {
            ...prev.images,
            [prev.selectedId]: { ...entry, isCompressing: false },
          },
        };
      });
    },
  });

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setError(null);

      const newEntries: ImageEntry[] = [];

      for (const file of files) {
        try {
          const loaded = await loadImageFromFile(file);
          const url = URL.createObjectURL(file);
          const format = getMimeType(file);
          const aspectRatio = loaded.width / loaded.height;
          const id = generateId();

          const entrySettings: CompressionSettings = {
            ...DEFAULT_SETTINGS,
            width: loaded.width,
            height: loaded.height,
            format,
          };

          historiesRef.current[id] = { entries: [] };

          newEntries.push({
            id,
            originalFile: file,
            originalUrl: url,
            originalWidth: loaded.width,
            originalHeight: loaded.height,
            compressedBlob: null,
            compressedUrl: null,
            isCompressing: false,
            settings: entrySettings,
            aspectRatio,
          });
        } catch {
          setError("Failed to load one or more images. Please try different files.");
        }
      }

      if (newEntries.length === 0) return;

      setState((prev) => {
        const newImages = { ...prev.images };
        const newOrder = [...prev.order];
        for (const entry of newEntries) {
          newImages[entry.id] = entry;
          newOrder.push(entry.id);
        }
        // Select first new image if nothing is selected
        const selectedId = prev.selectedId ?? newEntries[0].id;
        return { images: newImages, order: newOrder, selectedId };
      });
    },
    []
  );

  // Backward compat: single file handler
  const handleFileSelected = useCallback(
    async (file: File) => {
      await handleFilesSelected([file]);
    },
    [handleFilesSelected]
  );

  const handleSelect = useCallback((id: ImageId) => {
    setState((prev) => {
      if (!prev.images[id]) return prev;
      return { ...prev, selectedId: id };
    });
  }, []);

  const handleRemove = useCallback(
    (id: ImageId) => {
      setState((prev) => {
        const entry = prev.images[id];
        if (!entry) return prev;

        // Revoke URLs
        URL.revokeObjectURL(entry.originalUrl);
        if (entry.compressedUrl) {
          URL.revokeObjectURL(entry.compressedUrl);
        }

        const newImages = { ...prev.images };
        delete newImages[id];
        const newOrder = prev.order.filter((oid) => oid !== id);

        // Clean up history
        delete historiesRef.current[id];

        // Select next image if we removed the selected one
        let selectedId = prev.selectedId;
        if (selectedId === id) {
          const oldIdx = prev.order.indexOf(id);
          if (newOrder.length === 0) {
            selectedId = null;
          } else if (oldIdx >= newOrder.length) {
            selectedId = newOrder[newOrder.length - 1];
          } else {
            selectedId = newOrder[oldIdx];
          }
        }

        return { images: newImages, order: newOrder, selectedId };
      });
    },
    []
  );

  const updateSettings = useCallback(
    (partial: Partial<CompressionSettings>) => {
      setState((prev) => {
        if (!prev.selectedId) return prev;
        const entry = prev.images[prev.selectedId];
        if (!entry) return prev;

        const next = { ...entry.settings, ...partial };

        // Handle aspect ratio locking
        if (next.maintainAspectRatio) {
          if (partial.width !== undefined && partial.width !== entry.settings.width) {
            next.height = Math.round(partial.width / entry.aspectRatio);
          } else if (partial.height !== undefined && partial.height !== entry.settings.height) {
            next.width = Math.round(partial.height * entry.aspectRatio);
          }
        }

        // Push current settings to undo history
        const history = historiesRef.current[prev.selectedId];
        if (history) {
          history.entries = [
            ...history.entries.slice(-(MAX_HISTORY - 1)),
            structuredClone(entry.settings),
          ];
        }

        return {
          ...prev,
          images: {
            ...prev.images,
            [prev.selectedId]: {
              ...entry,
              settings: next,
              // Invalidate compressed result since settings changed
              isCompressing: true,
            },
          },
        };
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedId) return prev;
      const history = historiesRef.current[prev.selectedId];
      if (!history || history.entries.length === 0) return prev;

      const entry = prev.images[prev.selectedId];
      if (!entry) return prev;

      const previous = history.entries[history.entries.length - 1];
      history.entries = history.entries.slice(0, -1);

      return {
        ...prev,
        images: {
          ...prev.images,
          [prev.selectedId]: {
            ...entry,
            settings: previous,
            isCompressing: true,
          },
        },
      };
    });
  }, []);

  const handleApplyToAll = useCallback(
    (partial: { quality?: number; format?: CompressionSettings["format"] }) => {
      setState((prev) => {
        const newImages = { ...prev.images };
        const nonSelectedIds: ImageId[] = [];

        for (const id of prev.order) {
          const entry = newImages[id];
          if (!entry) continue;

          // Push to undo history for each image
          const history = historiesRef.current[id];
          if (history) {
            history.entries = [
              ...history.entries.slice(-(MAX_HISTORY - 1)),
              structuredClone(entry.settings),
            ];
          }

          const isSelected = id === prev.selectedId;
          const newSettings = { ...entry.settings, ...partial };
          const settingsChanged =
            newSettings.quality !== entry.settings.quality ||
            newSettings.format !== entry.settings.format;

          newImages[id] = {
            ...entry,
            settings: newSettings,
            // Selected image: only mark compressing if deps actually changed
            // (otherwise the debounced hook won't re-fire).
            // Non-selected images: compressed eagerly below.
            isCompressing: isSelected ? settingsChanged : false,
          };

          if (!isSelected && settingsChanged) {
            nonSelectedIds.push(id);
          }
        }

        // Kick off eager compression for non-selected images
        for (const id of nonSelectedIds) {
          const entry = newImages[id];
          if (!entry) continue;
          const s = entry.settings;
          compressImage({
            imageUrl: entry.originalUrl,
            width: s.width,
            height: s.height,
            format: s.format,
            quality: s.quality,
          }).then((result) => {
            setState((cur) => {
              const e = cur.images[id];
              if (!e) return cur;
              if (e.compressedUrl) {
                URL.revokeObjectURL(e.compressedUrl);
              }
              return {
                ...cur,
                images: {
                  ...cur.images,
                  [id]: {
                    ...e,
                    compressedBlob: result.blob,
                    compressedUrl: result.url,
                    isCompressing: false,
                  },
                },
              };
            });
          }).catch(() => {
            setState((cur) => {
              const e = cur.images[id];
              if (!e) return cur;
              return {
                ...cur,
                images: {
                  ...cur.images,
                  [id]: { ...e, isCompressing: false },
                },
              };
            });
          });
        }

        return { ...prev, images: newImages };
      });
    },
    []
  );

  const handleHalveAll = useCallback(() => {
    setState((prev) => {
      const newImages = { ...prev.images };
      const nonSelectedIds: ImageId[] = [];

      for (const id of prev.order) {
        const entry = newImages[id];
        if (!entry) continue;

        const newWidth = Math.max(1, Math.round(entry.originalWidth / 2));
        const newHeight = Math.max(1, Math.round(entry.originalHeight / 2));

        const settingsChanged =
          newWidth !== entry.settings.width || newHeight !== entry.settings.height;
        if (!settingsChanged) continue;

        const history = historiesRef.current[id];
        if (history) {
          history.entries = [
            ...history.entries.slice(-(MAX_HISTORY - 1)),
            structuredClone(entry.settings),
          ];
        }

        const isSelected = id === prev.selectedId;
        newImages[id] = {
          ...entry,
          settings: { ...entry.settings, width: newWidth, height: newHeight },
          isCompressing: isSelected,
        };

        if (!isSelected) {
          nonSelectedIds.push(id);
        }
      }

      for (const id of nonSelectedIds) {
        const entry = newImages[id];
        if (!entry) continue;
        const s = entry.settings;
        compressImage({
          imageUrl: entry.originalUrl,
          width: s.width,
          height: s.height,
          format: s.format,
          quality: s.quality,
        }).then((result) => {
          setState((cur) => {
            const e = cur.images[id];
            if (!e) return cur;
            if (e.compressedUrl) {
              URL.revokeObjectURL(e.compressedUrl);
            }
            return {
              ...cur,
              images: {
                ...cur.images,
                [id]: {
                  ...e,
                  compressedBlob: result.blob,
                  compressedUrl: result.url,
                  isCompressing: false,
                },
              },
            };
          });
        }).catch(() => {
          setState((cur) => {
            const e = cur.images[id];
            if (!e) return cur;
            return {
              ...cur,
              images: {
                ...cur.images,
                [id]: { ...e, isCompressing: false },
              },
            };
          });
        });
      }

      return { ...prev, images: newImages };
    });
  }, []);

  const handleDownload = useCallback(() => {
    if (!selected?.compressedUrl || !selected.compressedBlob) return;

    const ext = getExtension(selected.settings.format);
    const baseName =
      selected.originalFile.name.replace(/\.[^.]+$/, "") || "compressed";
    const fileName = `${baseName}-compressed.${ext}`;

    const a = document.createElement("a");
    a.href = selected.compressedUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [selected]);

  const handleDownloadAll = useCallback(async () => {
    for (const id of state.order) {
      const entry = state.images[id];
      if (!entry) continue;

      let blob = entry.compressedBlob;
      let url = entry.compressedUrl;

      // Compress inline if not yet compressed
      if (!blob) {
        try {
          const result = await compressImage({
            imageUrl: entry.originalUrl,
            width: entry.settings.width,
            height: entry.settings.height,
            format: entry.settings.format,
            quality: entry.settings.quality,
          });
          blob = result.blob;
          url = result.url;

          // Update state with result
          updateEntry(id, (e) => ({
            ...e,
            compressedBlob: result.blob,
            compressedUrl: result.url,
            isCompressing: false,
          }));
        } catch {
          continue; // skip failed images
        }
      }

      if (!blob || !url) continue;

      const ext = getExtension(entry.settings.format);
      const baseName =
        entry.originalFile.name.replace(/\.[^.]+$/, "") || "compressed";
      const fileName = `${baseName}-compressed.${ext}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Small delay between downloads to avoid browser blocking
      if (state.order.length > 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }, [state.order, state.images, updateEntry]);

  const handleClear = useCallback(() => {
    // Revoke all URLs
    for (const id of state.order) {
      const entry = state.images[id];
      if (!entry) continue;
      URL.revokeObjectURL(entry.originalUrl);
      if (entry.compressedUrl) {
        URL.revokeObjectURL(entry.compressedUrl);
      }
    }
    historiesRef.current = {};
    setState(EMPTY_STATE);
    setError(null);
  }, [state.order, state.images]);

  // Aggregate stats for multi-image mode
  const aggregateStats = useMemo(() => {
    let totalOriginal = 0;
    let totalCompressed = 0;
    let compressedCount = 0;

    for (const id of state.order) {
      const entry = state.images[id];
      if (!entry) continue;
      totalOriginal += entry.originalFile.size;
      if (entry.compressedBlob) {
        totalCompressed += entry.compressedBlob.size;
        compressedCount++;
      }
    }

    return { totalOriginal, totalCompressed, compressedCount, count: state.order.length };
  }, [state.order, state.images]);

  // Build an imageState view compatible with existing components
  const imageState = selected
    ? {
        originalFile: selected.originalFile,
        originalUrl: selected.originalUrl,
        originalWidth: selected.originalWidth,
        originalHeight: selected.originalHeight,
        compressedBlob: selected.compressedBlob,
        compressedUrl: selected.compressedUrl,
        isCompressing: selected.isCompressing,
      }
    : null;

  return {
    imageState,
    settings,
    error,
    canUndo,
    imageCount,
    selectedId: state.selectedId,
    images: state.images,
    order: state.order,
    aggregateStats,
    handleFileSelected,
    handleFilesSelected,
    handleSelect,
    handleRemove,
    updateSettings,
    handleDownload,
    handleDownloadAll,
    handleApplyToAll,
    handleHalveAll,
    handleClear,
    handleUndo,
  };
}
