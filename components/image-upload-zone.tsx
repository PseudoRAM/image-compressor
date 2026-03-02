"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  onFilesSelected: (files: File[]) => void;
  compact?: boolean;
}

export function ImageUploadZone({ onFilesSelected, compact }: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const valid: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (ACCEPTED_TYPES.includes(file.type) || file.type.startsWith("image/")) {
          valid.push(file);
        }
      }
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
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
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input so re-selecting the same file(s) triggers change
      e.target.value = "";
    },
    [handleFiles]
  );

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add more images
        </Button>
      </>
    );
  }

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
        multiple
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
        {isDragOver ? "Drop your images here" : "Drop images or click to upload"}
      </p>
      <p className="text-sm text-muted-foreground">
        Supports JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG
      </p>
    </div>
  );
}
