"use client";

import { formatFileSize } from "@/lib/format-utils";
import { Badge } from "@/components/ui/badge";

interface AggregateStatsProps {
  count: number;
  totalOriginal: number;
  totalCompressed: number;
  compressedCount: number;
}

export function AggregateStats({
  count,
  totalOriginal,
  totalCompressed,
  compressedCount,
}: AggregateStatsProps) {
  const allCompressed = compressedCount === count;
  const savings =
    totalOriginal > 0 && totalCompressed > 0
      ? Math.round((1 - totalCompressed / totalOriginal) * 100)
      : 0;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="secondary">
        {count} {count === 1 ? "image" : "images"}
      </Badge>
      <span>
        {formatFileSize(totalOriginal)}
        {allCompressed && totalCompressed > 0 && (
          <>
            {" → "}
            {formatFileSize(totalCompressed)}
          </>
        )}
      </span>
      {allCompressed && savings > 0 && (
        <Badge variant="outline" className="text-green-600 border-green-300">
          {savings}% saved
        </Badge>
      )}
      {!allCompressed && compressedCount > 0 && (
        <span className="text-xs">
          ({compressedCount}/{count} compressed)
        </span>
      )}
    </div>
  );
}
