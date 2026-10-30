import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// pdf-lib, pdfjs-dist and jszip are only ever imported dynamically inside
// tool logic (see src/tools/pdf/*), so Vite/Rolldown already code-splits
// them into their own chunks automatically — no manualChunks needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
