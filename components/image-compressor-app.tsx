"use client";

import { useState } from "react";
import { useImageCompressor } from "@/hooks/use-image-compressor";
import { ImageUploadZone } from "./image-upload-zone";
import { CompressionControls } from "./compression-controls";
import { ImageComparisonSlider } from "./image-comparison-slider";
import { ImagePreview } from "./image-preview";
import { FileSizeIndicator } from "./file-size-indicator";
import { Toolbar } from "./toolbar";
import { ImageThumbnailGrid } from "./image-thumbnail-grid";
import { AggregateStats } from "./aggregate-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, TriangleAlert } from "lucide-react";

export function ImageCompressorApp() {
  const {
    imageState,
    settings,
    error,
    canUndo,
    imageCount,
    selectedId,
    images,
    order,
    aggregateStats,
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
  } = useImageCompressor();

  const [showComparison, setShowComparison] = useState(false);

  const hasImage = imageState !== null;
  const hasCompressed = imageState?.compressedBlob !== null && imageState?.compressedUrl !== null;
  const isMulti = imageCount > 1;

  if (!hasImage) {
    return (
      <div className="mx-auto max-w-2xl">
        <ImageUploadZone onFilesSelected={handleFilesSelected} />
      </div>
    );
  }

  const isLarger =
    hasCompressed &&
    imageState.compressedBlob &&
    imageState.compressedBlob.size > imageState.originalFile.size;

  return (
    <div className="space-y-6">
      {/* Multi-image strip + stats */}
      {isMulti && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <AggregateStats
              count={aggregateStats.count}
              totalOriginal={aggregateStats.totalOriginal}
              totalCompressed={aggregateStats.totalCompressed}
              compressedCount={aggregateStats.compressedCount}
            />
          </div>
          <ImageThumbnailGrid
            images={images}
            order={order}
            selectedId={selectedId}
            onSelect={handleSelect}
            onRemove={handleRemove}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left column: Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Settings</CardTitle>
              <p className="text-xs text-muted-foreground">
                Adjust quality, size, and format — changes apply automatically
              </p>
            </CardHeader>
            <CardContent>
              <CompressionControls
                settings={settings}
                onUpdate={updateSettings}
                imageCount={imageCount}
                onApplyToAll={handleApplyToAll}
                onHalveAll={handleHalveAll}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="comparison-toggle" className="text-sm font-medium">
                      Comparison View
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-help">(drag to compare)</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle a side-by-side slider to compare the original and compressed images</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="comparison-toggle"
                    checked={showComparison}
                    onCheckedChange={setShowComparison}
                    disabled={!hasCompressed}
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    File Size
                  </p>
                  <FileSizeIndicator
                    originalSize={imageState.originalFile.size}
                    compressedSize={imageState.compressedBlob?.size ?? null}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact upload zone for adding more images / clear link */}
          {isMulti ? (
            <ImageUploadZone onFilesSelected={handleFilesSelected} compact />
          ) : (
            <button
              onClick={handleClear}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Upload a different image
            </button>
          )}
        </div>

        {/* Right column: Preview + Toolbar */}
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {isLarger && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              Compressed file is larger than the original — try lowering quality or switching to WebP
            </div>
          )}

          {showComparison && hasCompressed && imageState.compressedUrl ? (
            <ImageComparisonSlider
              originalUrl={imageState.originalUrl}
              compressedUrl={imageState.compressedUrl}
            />
          ) : (
            <ImagePreview
              compressedUrl={imageState.compressedUrl}
              isCompressing={imageState.isCompressing}
            />
          )}

          {/* Toolbar — centered */}
          <Toolbar
            canDownload={hasCompressed}
            canUndo={canUndo}
            onDownload={handleDownload}
            onUndo={handleUndo}
            onClear={handleClear}
            imageCount={imageCount}
            onDownloadAll={handleDownloadAll}
            onRemove={selectedId ? () => handleRemove(selectedId) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
