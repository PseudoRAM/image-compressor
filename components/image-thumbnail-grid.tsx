"use client";

import { X, Loader2, Check } from "lucide-react";
import { ImageId, ImageEntry } from "@/types";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format-utils";

interface ImageThumbnailGridProps {
  images: Record<ImageId, ImageEntry>;
  order: ImageId[];
  selectedId: ImageId | null;
  onSelect: (id: ImageId) => void;
  onRemove: (id: ImageId) => void;
}

export function ImageThumbnailGrid({
  images,
  order,
  selectedId,
  onSelect,
  onRemove,
}: ImageThumbnailGridProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 pt-2 pr-2">
      {order.map((id) => {
        const entry = images[id];
        if (!entry) return null;

        const isSelected = id === selectedId;
        const isCompressing = entry.isCompressing;
        const isCompressed = entry.compressedBlob !== null;
        const displaySize = entry.compressedBlob
          ? entry.compressedBlob.size
          : entry.originalFile.size;

        return (
          <div
            key={id}
            className="relative shrink-0 group flex flex-col items-center gap-1"
          >
            <button
              onClick={() => onSelect(id)}
              className={cn(
                "relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-muted hover:border-muted-foreground/50",
              )}
            >
              <img
                src={entry.originalUrl}
                alt={entry.originalFile.name}
                className="h-full w-full object-cover"
              />

              {/* Status indicator */}
              <div className="absolute bottom-0.5 right-0.5">
                {isCompressing ? (
                  <div className="rounded-full bg-background/80 p-0.5">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </div>
                ) : isCompressed ? (
                  <div className="rounded-full bg-green-500/90 p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : null}
              </div>
            </button>

            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatFileSize(displaySize)}
            </span>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
              className="absolute right-0.5 top-0.5 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm transition-opacity group-hover:block"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
