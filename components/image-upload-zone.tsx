"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/svg+xml",
];

interface ImageUploadZoneProps {
  onFileSelected: (file: File) => void;
}

export function ImageUploadZone({ onFileSelected }: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (ACCEPTED_TYPES.includes(file.type) || file.type.startsWith("image/")) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        className={cn(
          "mb-4 rounded-full bg-muted p-4 transition-transform",
          isDragOver && "scale-110"
        )}
      >
        {isDragOver ? (
          <Upload className="h-8 w-8 text-primary" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <p className="mb-1 text-lg font-medium">
        {isDragOver ? "Drop your image here" : "Drop an image or click to upload"}
      </p>
      <p className="text-sm text-muted-foreground">
        Supports JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG
      </p>
    </div>
  );
}
