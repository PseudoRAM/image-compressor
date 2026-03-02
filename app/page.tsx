import { ImageCompressorApp } from "@/components/image-compressor-app";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Image Compressor
          </h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            100% client-side — your images never leave your device
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ImageCompressorApp />
      </main>
    </div>
  );
}
