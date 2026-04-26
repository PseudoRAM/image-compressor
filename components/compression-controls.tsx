"use client";

import { useCallback } from "react";
import { Link, Unlink, Info, CopyCheck, Minimize2 } from "lucide-react";
import { CompressionSettings, OutputFormat } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CompressionControlsProps {
  settings: CompressionSettings;
  onUpdate: (partial: Partial<CompressionSettings>) => void;
  imageCount?: number;
  onApplyToAll?: (partial: { quality?: number; format?: OutputFormat }) => void;
  onHalveAll?: () => void;
}

export function CompressionControls({
  settings,
  onUpdate,
  imageCount = 1,
  onApplyToAll,
  onHalveAll,
}: CompressionControlsProps) {
  const isPng = settings.format === "image/png";

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        onUpdate({ width: value });
      }
    },
    [onUpdate]
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        onUpdate({ height: value });
      }
    },
    [onUpdate]
  );

  return (
    <div className="space-y-6">
      {/* Quality Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Label>Quality</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p>Lower quality = smaller file size. Values around 70-85 offer a good balance.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {settings.quality}%
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Slider
                value={[settings.quality]}
                onValueChange={([v]) => onUpdate({ quality: v })}
                min={1}
                max={100}
                step={1}
                disabled={isPng}
                className={isPng ? "opacity-50" : ""}
              />
            </div>
          </TooltipTrigger>
          {isPng && (
            <TooltipContent>
              <p>PNG is lossless — quality setting has no effect</p>
            </TooltipContent>
          )}
        </Tooltip>
        <p className="text-xs text-muted-foreground">
          {isPng
            ? "PNG uses lossless compression — quality slider is disabled"
            : settings.quality >= 90
              ? "High quality — larger file size, minimal artifacts"
              : settings.quality >= 60
                ? "Balanced — good quality with reasonable file size"
                : "Aggressive — small file size, visible artifacts possible"}
        </p>
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Label>Dimensions</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[220px]">
              <p>Resize the output image. Smaller dimensions significantly reduce file size.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="width" className="text-xs text-muted-foreground">
              Width (px)
            </Label>
            <Input
              id="width"
              type="number"
              min={1}
              value={settings.width}
              onChange={handleWidthChange}
              placeholder="Width"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 mt-5"
                onClick={() =>
                  onUpdate({ maintainAspectRatio: !settings.maintainAspectRatio })
                }
              >
                {settings.maintainAspectRatio ? (
                  <Link className="h-4 w-4" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {settings.maintainAspectRatio
                  ? "Aspect ratio locked — click to unlock"
                  : "Aspect ratio unlocked — click to lock"}
              </p>
            </TooltipContent>
          </Tooltip>

          <div className="flex-1 space-y-1">
            <Label htmlFor="height" className="text-xs text-muted-foreground">
              Height (px)
            </Label>
            <Input
              id="height"
              type="number"
              min={1}
              value={settings.height}
              onChange={handleHeightChange}
              placeholder="Height"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {settings.maintainAspectRatio
            ? "Aspect ratio is locked — changing one dimension updates the other"
            : "Aspect ratio is unlocked — dimensions can be set independently"}
        </p>
      </div>

      {/* Output Format */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Label>Output Format</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[240px]">
              <p>JPEG is best for photos. PNG for graphics with transparency. WebP offers the best compression for both.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={settings.format}
          onValueChange={(v) => onUpdate({ format: v as OutputFormat })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image/jpeg">JPEG</SelectItem>
            <SelectItem value="image/png">PNG</SelectItem>
            <SelectItem value="image/webp">WebP</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {settings.format === "image/jpeg"
            ? "JPEG — lossy compression, great for photographs"
            : settings.format === "image/png"
              ? "PNG — lossless compression, supports transparency"
              : "WebP — modern format with superior compression"}
        </p>
      </div>

      {imageCount > 1 && onApplyToAll && (
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() =>
            onApplyToAll({ quality: settings.quality, format: settings.format })
          }
        >
          <CopyCheck className="mr-2 h-4 w-4" />
          Apply to all images
        </Button>
      )}

      {imageCount > 1 && onHalveAll && (
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={onHalveAll}
        >
          <Minimize2 className="mr-2 h-4 w-4" />
          Scale all to 50%
        </Button>
      )}
    </div>
  );
}
