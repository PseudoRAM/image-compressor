"use client";

import { useRef, useCallback, useState } from "react";

interface ImageComparisonSliderProps {
  originalUrl: string;
  compressedUrl: string;
}

export function ImageComparisonSlider({
  originalUrl,
  compressedUrl,
}: ImageComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPosition((p) => Math.max(0, p - 1));
      } else if (e.key === "ArrowRight") {
        setPosition((p) => Math.min(100, p + 1));
      }
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full select-none overflow-hidden rounded-lg bg-muted"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Image comparison slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
    >
      {/* Compressed (background) */}
      <img
        src={compressedUrl}
        alt="Compressed"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      {/* Original (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={originalUrl}
          alt="Original"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white/90 shadow-lg backdrop-blur-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-gray-700"
          >
            <path
              d="M5 3L2 8L5 13M11 3L14 8L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
        Original
      </span>
      <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
        Compressed
      </span>
    </div>
  );
}
