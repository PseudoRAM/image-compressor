"use client";

import { Download, Undo2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarProps {
  canDownload: boolean;
  canUndo: boolean;
  onDownload: () => void;
  onUndo: () => void;
  onClear: () => void;
  imageCount?: number;
  onDownloadAll?: () => void;
  onRemove?: () => void;
}

export function Toolbar({
  canDownload,
  canUndo,
  onDownload,
  onUndo,
  onClear,
  imageCount = 1,
  onDownloadAll,
  onRemove,
}: ToolbarProps) {
  const isMulti = imageCount > 1;

  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button onClick={onDownload} disabled={!canDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{canDownload ? "Save the compressed image to your device" : "Waiting for compression to finish..."}</p>
        </TooltipContent>
      </Tooltip>

      {isMulti && onDownloadAll && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onDownloadAll}>
              <Download className="mr-2 h-4 w-4" />
              Download All ({imageCount})
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download all {imageCount} compressed images</p>
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button variant="outline" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="mr-2 h-4 w-4" />
              Undo
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{canUndo ? "Revert to previous settings" : "No previous settings to undo"}</p>
        </TooltipContent>
      </Tooltip>

      {isMulti && onRemove && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onRemove}>
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove the selected image</p>
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMulti ? "Remove all images and start over" : "Remove image and start over"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
