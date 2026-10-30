# FileSwift

Free, browser-based file, image and PDF tools. Built as a static React app —
no backend, no database, no accounts, no paid APIs.

**Live tools in this version:** Image Compressor, Image Resizer, JPG↔PNG,
JPG↔WebP, WebP↔JPG, Images to PDF, PDF to JPG, Merge PDF, Compress PDF.
33 more tools are scaffolded in `src/data/tools.js` and show as "coming
soon" until implemented — see **Adding a new tool** below.

## What runs where

Every implemented tool processes files **entirely in the browser**:

- Image tools use the Canvas API (`canvas.toBlob`) to compress, resize and
  re-encode images. Nothing is uploaded.
- PDF tools use [`pdf-lib`](https://github.com/Hopding/pdf-lib) (create/merge
  PDFs) and [`pdfjs-dist`](https://github.com/mozilla/pdf.js) (render PDF
  pages to images), both lazy-loaded only on PDF tool pages. Nothing is
  uploaded.
- "Compress PDF" re-renders each page as a re-compressed image to achieve
  real size savings — this means the output PDF's text is no longer
  selectable. That trade-off is explained in the tool's UI.

No file ever touches a server in this version. If you add a tool later that
genuinely requires server-side processing, say so explicitly on that tool's
page — see `src/pages/Privacy.jsx`, which already promises this.

## Tech stack

- React 19 + Vite 8 + Tailwind CSS v4
- `react-router-dom` for routing (client-side only — see deployment note below)
- `react-helmet-async` for per-page SEO meta tags
- `pdf-lib`, `pdfjs-dist`, `jszip` — all dynamically imported so they never
  load on pages that don't need them
- `lucide-react` for icons (explicit imports in `ToolIcon.jsx`, not `import *`,
  to keep the icon set tree-shakeable)

## Project structure

```
src/
  components/   Reusable UI: Header, Footer, UploadDropzone, ToolCard, SEO, ...
  pages/        Route-level pages: Home, AllTools, CategoryPage, ToolPage, Blog, ...
  tools/
    image/      Pure processing functions (compressImage, resizeImage, convertImage — supports JPG, PNG, WebP, BMP output)
    pdf/        Pure processing functions (imagesToPdf, pdfToJpg, mergePdf, compressPdf)
    ui/         The control-panel React component for each tool (sliders, upload, download)
    registry.jsx  Maps a tool slug -> { Component, props } — see below
  data/
    tools.js      Every tool's metadata (name, description, SEO copy, implemented flag)
    categories.js Image/PDF/Other category metadata
    blogPosts.js  Static blog content (no CMS/database)
  utils/        File validation, download/ZIP helpers, formatting helpers
scripts/
  generate-sitemap.js   Regenerates public/sitemap.xml from the tool + blog registries (runs on every build)
```

## Adding a new tool

1. Add an entry to `src/data/tools.js` with `implemented: true` and (ideally)
   `seo: { title, description, h1, intro }`.
2. Write the processing logic as a pure function in `src/tools/image/` or
   `src/tools/pdf/` — it should take a `File`/`File[]` and return a `Blob`
   (or throw a descriptive `Error`).
3. Build a small control-panel component in `src/tools/ui/` using the
   existing tools as a template (`UploadDropzone`, `FilePreview`,
   `StatusBanner`, `DownloadButton` are all reusable).
4. Register it in `src/tools/registry.jsx`:
   ```js
   const MyNewTool = lazy(() => import('./ui/MyNewTool.jsx'))
   export const toolRegistry = {
     // ...
     'my-new-tool': { Component: MyNewTool },
   }
   ```
   `ToolPage.jsx` and the sitemap generator pick it up automatically.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # also regenerates public/sitemap.xml first
npm run preview # serve the production build locally
```

## Deploying (free)

This is a fully static site — deploy the `dist/` output to any static host.

### Vercel (recommended, `vercel.json` included)

1. Push this repo to GitHub.
2. Import it in Vercel → framework preset **Vite** → deploy.
3. `vercel.json` already rewrites all routes to `index.html`, which is
   required because routing (`/tools/compress-image`, etc.) happens
   client-side with React Router.
4. Point your custom domain at the Vercel project. That's the only paid
   part of this stack.

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Add a `_redirects` file with `/* /index.html 200` (Cloudflare Pages does
  this automatically for SPA frameworks it detects, but add it manually if
  routes 404 on refresh).

### GitHub Pages

GitHub Pages doesn't support catch-all rewrites, so client-side routes will
404 on a hard refresh unless you add a `404.html` that redirects back into
the app, or switch `BrowserRouter` to `HashRouter` in `src/main.jsx`
(URLs become `/#/tools/compress-image`, which works with zero extra config).

## Environment variables

**None required.** There are no API keys, database URLs, or secrets in this
project — that's intentional, per the "no paid APIs / no database" brief.

Before going live, update the two hardcoded placeholders in the codebase:

- `SITE_URL` in `src/components/SEO.jsx`
- `SITE_URL` in `scripts/generate-sitemap.js`
- The domain in `public/robots.txt`

...to your actual purchased domain, once you have one.

## Monetization (Google AdSense)

`src/components/AdPlaceholder.jsx` renders clearly-labeled, correctly-sized
reserved slots (`top`, `tool`, `content`, `footer`) so your layout won't
shift when you swap in real ad units. Once AdSense approves your site,
replace the placeholder's contents with your `<ins class="adsbygoogle">`
tag — no other changes needed.

## What's not implemented yet

33 of the 43 planned tools show a "coming soon" state on their tool page
(see `src/pages/ToolPage.jsx`) rather than a broken link, and are excluded
from the sitemap until `implemented: true` is set. This keeps the site
honest with users and search engines about what's actually usable today.

## AI models (background remover, passport photos)

The Background Remover and the "make background white" option in the photo tools run a
U²-Net segmentation model (Apache-2.0) with `onnxruntime-web` (MIT), fully in the browser.
The model files (~49 MB) are not stored in git. They are downloaded into `public/models/`
automatically by `npm run dev` / `npm run build` (or manually with `npm run models`) and
checked against pinned SHA-256 hashes. To skip the larger "Best quality" model, delete its
entry from `BG_MODELS` in `src/tools/image/removeBackground.js`.
