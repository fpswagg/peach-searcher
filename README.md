# Peach Searcher - Media Gallery

A beautiful, minimalist media gallery built with Next.js App Router, DaisyUI, and shadcn/ui.

## Features

- 🖼️ **100+ Media Items**: Browse through a collection of images and videos
- 🎬 **Video Support**: Videos include thumbnails and can be played in a dialog
- 📄 **Pagination**: Navigate through media with an elegant pagination system
- 🎨 **Modern Design**: Clean, minimalist interface using DaisyUI and shadcn components
- 📱 **Responsive**: Works beautifully on all device sizes
- ⬇️ **Download Support**: Download any media file directly

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **DaisyUI**
- **shadcn/ui**
- **Radix UI** (Dialog component)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

To create a production build:

```bash
npm run build
```

## Project Structure

```
peach-searcher/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Gallery page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/
│   │   └── dialog.tsx      # shadcn dialog component
│   ├── media-card.tsx      # Media card component
│   └── media-dialog.tsx    # Media viewer dialog
├── data/
│   └── media.ts            # Dummy media data
└── lib/
    └── utils.ts            # Utility functions
```

## License

MIT


