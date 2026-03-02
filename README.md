# Image Compressor

A fully client-side image compression web app built with Next.js. Upload images via drag-and-drop or file picker, adjust quality, resize, change format, compare before/after with a draggable slider, and download the result — all without uploading anything to a server.

## Features

- **100% Client-Side** — images never leave your browser. All compression happens via the Canvas API.
- **Drag-and-Drop Upload** — drop an image anywhere on the upload zone, or click to browse files.
- **Quality Control** — adjust JPEG/WebP quality from 1–100 with a slider. Contextual hints explain the tradeoff at each level.
- **Resize with Aspect Ratio Lock** — set custom width/height with a toggleable aspect ratio lock.
- **Format Conversion** — convert between JPEG, PNG, and WebP with a single dropdown.
- **Live File Size Feedback** — see original vs compressed size and percentage reduction, updated in real time.
- **Before/After Comparison Slider** — toggle a draggable slider overlay to compare the original and compressed images side by side.
- **Fullscreen Zoomable Preview** — click the preview image to open a near-fullscreen dialog with scroll-to-zoom, drag-to-pan, and zoom controls.
- **Undo History** — revert to any previous compression setting with one click (up to 50 entries).
- **Debounced Compression** — settings changes are debounced (300ms) so the UI stays responsive while the compressor catches up.
- **Responsive Layout** — two-column layout on desktop (controls left, preview right), single-column stacked on mobile.
- **Tooltips and Helper Text** — every control has contextual guidance explaining what it does and how it affects output.

## Supported Input Formats

JPEG, PNG, WebP, GIF (first frame), BMP, TIFF, AVIF, SVG (rasterized to chosen output format).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) (Button, Slider, Input, Select, Switch, Dialog, Tooltip, Card, Badge, etc.) |
| Icons | [Lucide React](https://lucide.dev/) |
| Compression | Browser Canvas API (`canvas.toBlob()`) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or your preferred package manager)

### Install

```bash
git clone <repo-url> image-compressor
cd image-compressor
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
image-compressor/
├── app/
│   ├── layout.tsx                     # Root layout with TooltipProvider
│   ├── page.tsx                       # Home page — header + ImageCompressorApp
│   └── globals.css                    # Tailwind + shadcn CSS variables
├── components/
│   ├── ui/                            # shadcn/ui primitives (button, slider, dialog, etc.)
│   ├── image-compressor-app.tsx       # Top-level client component, orchestrates everything
│   ├── image-upload-zone.tsx          # Drag-and-drop + file picker upload zone
│   ├── compression-controls.tsx       # Quality slider, resize inputs, format selector
│   ├── image-comparison-slider.tsx    # Before/after draggable comparison slider
│   ├── image-preview.tsx             # Compressed preview + fullscreen zoomable dialog
│   ├── toolbar.tsx                    # Download, Undo, Clear buttons (centered)
│   └── file-size-indicator.tsx        # Original → Compressed size with % badge
├── hooks/
│   ├── use-image-compressor.ts        # Central orchestration hook (state, handlers)
│   ├── use-undo-history.ts            # Generic undo stack (push/undo/clear, max 50)
│   └── use-debounced-compression.ts   # 300ms debounced compression with AbortController
├── lib/
│   ├── compress.ts                    # Canvas-based compression pipeline
│   ├── image-loader.ts               # File → HTMLImageElement loader
│   ├── format-utils.ts               # formatFileSize(), MIME helpers, extensions
│   └── utils.ts                       # cn() class merge utility (shadcn)
└── types/
    └── index.ts                       # CompressionSettings, ImageState, OutputFormat, HistoryEntry
```

## How It Works

1. **Upload** — user drops or picks an image file. The file is loaded into an `HTMLImageElement` to read its natural dimensions.
2. **Settings** — quality (1–100), width, height, and output format are exposed as controls. Each change pushes to the undo stack.
3. **Compression** — after a 300ms debounce, the image is drawn onto an offscreen `<canvas>` at the target dimensions, then exported via `canvas.toBlob(callback, mimeType, quality)`. An `AbortController` cancels stale in-flight compressions.
4. **Preview** — the resulting `Blob` is turned into an Object URL and displayed. Users can toggle a comparison slider or click the preview for a fullscreen zoomable view.
5. **Download** — a programmatic `<a>` element triggers a download of the compressed blob with a descriptive filename.
6. **Cleanup** — Object URLs are revoked on every new compression and on unmount to prevent memory leaks.

## Performance Notes

- **Debounced compression** — the slider feels instant because re-renders happen immediately, but the actual Canvas work only fires after 300ms of inactivity.
- **Object URLs over data URLs** — avoids the ~33% overhead of base64 encoding.
- **AbortController** — overlapping compressions are cancelled so only the latest settings produce output.
- **Pointer Events API** — the comparison slider and zoom dialog use `onPointerDown`/`onPointerMove`/`onPointerUp` for unified mouse + touch support.

## Deployment

This is a static Next.js app with no server-side data fetching. It can be deployed to any static hosting or edge platform:

- **Vercel** — `npx vercel` or push to a connected Git repo
- **Netlify** — set build command to `npm run build` and publish directory to `.next`
- **Static export** — add `output: 'export'` to `next.config.ts` and run `npm run build` to generate a fully static site in `out/`

## License

MIT
