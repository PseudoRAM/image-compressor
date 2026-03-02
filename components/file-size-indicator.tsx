"use client";

import { formatFileSize } from "@/lib/format-utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface FileSizeIndicatorProps {
  originalSize: number;
  compressedSize: number | null;
}

export function FileSizeIndicator({
  originalSize,
  compressedSize,
}: FileSizeIndicatorProps) {
  const reduction =
    compressedSize !== null
      ? Math.round((1 - compressedSize / originalSize) * 100)
      : null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">{formatFileSize(originalSize)}</span>

      {compressedSize !== null && (
        <>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{formatFileSize(compressedSize)}</span>

          {reduction !== null && (
            <Badge variant={reduction > 0 ? "default" : "destructive"}>
              {reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`}
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
