"use client";

import { useState, useCallback, useRef } from "react";
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImagePreviewProps {
  compressedUrl: string | null;
  isCompressing: boolean;
}

export function ImagePreview({ compressedUrl, isCompressing }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleOpen = useCallback(() => {
    resetZoom();
    setOpen(true);
  }, [resetZoom]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 0.5);
      if (next <= 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => {
      const next = Math.max(0.5, Math.min(5, s - e.deltaY * 0.002));
      if (next <= 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTx: translate.x,
        startTy: translate.y,
      };
    },
    [scale, translate]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTranslate({
      x: dragRef.current.startTx + dx,
      y: dragRef.current.startTy + dy,
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="group relative flex items-center justify-center overflow-hidden rounded-lg bg-muted/50 cursor-pointer"
            onClick={compressedUrl ? handleOpen : undefined}
          >
            {compressedUrl ? (
              <>
                <img
                  src={compressedUrl}
                  alt="Compressed preview"
                  className="max-h-[400px] w-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                  <div className="rounded-full bg-white/90 p-2.5 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    <Search className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No preview available</p>
              </div>
            )}

            {isCompressing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Compressing...</span>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        {compressedUrl && !isCompressing && (
          <TooltipContent>
            <p>Click to open fullscreen preview</p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Fullscreen zoomable dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!inset-2 !top-2 !left-2 !translate-x-0 !translate-y-0 !max-w-none !w-auto !h-auto p-0 overflow-hidden border-0 rounded-xl bg-black/95 [&>button]:text-white [&>button]:hover:bg-white/20">
          <DialogTitle className="sr-only">Image preview</DialogTitle>

          {/* Zoom controls */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs font-medium text-white tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={resetZoom}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoomable image area */}
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ cursor: scale > 1 ? "grab" : "default" }}
          >
            {compressedUrl && (
              <img
                src={compressedUrl}
                alt="Full-size compressed preview"
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transition: dragRef.current ? "none" : "transform 0.15s ease-out",
                }}
              />
            )}
          </div>

          {/* Helper text */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-xs text-white/70">Scroll to zoom &middot; Drag to pan &middot; Esc to close</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
