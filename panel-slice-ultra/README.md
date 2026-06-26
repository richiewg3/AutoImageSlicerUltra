# Panel Slice Ultra

Mobile-first Progressive Web App for splitting one larger image into multiple separate outputs using horizontal slice lines, vertical slice lines, and custom crop boxes.

## Features

- Upload a single image and enter an editing workspace
- Place horizontal and vertical slice lines
- Draw custom crop boxes for irregular regions
- Select, move, delete, undo, and reset your layout
- Preview generated outputs, play them back as an animation, and choose which to keep
- Export selected outputs individually or as a ZIP
- Optional export aspect-ratio presets (1:1, 2:3, 3:2, 4:3, 3:4, 9:16, 16:9)
- Installable PWA suitable for Vercel deployment

## Development

```bash
cd panel-slice-ultra
npm install
npm run dev
```

Open http://localhost:3000

## Production build

```bash
cd panel-slice-ultra
npm run build
npm start
```

## Deploy on Vercel

Set the project root directory to `panel-slice-ultra` or deploy from that folder.

## Legacy Python auto-slicer

The repository also contains `AutoImageSlicerUltra`, a Python CLI and Flask UI that automatically detects panel gutters. That tool lives at the repository root under `src/autoimageslicerultra/`.
