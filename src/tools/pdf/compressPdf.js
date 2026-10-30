import { getPdfjs } from './pdfjsClient'

const LEVELS = {
  low: { scale: 2.0, quality: 0.85 },
  medium: { scale: 1.5, quality: 0.65 },
  high: { scale: 1.1, quality: 0.45 },
}

/**
 * Compresses a PDF by re-rendering each page as a re-encoded JPEG and
 * rebuilding a new PDF from those pages. This works well for scanned or
 * image-heavy PDFs, which are the overwhelming majority of "PDF is too big"
 * cases. Note: this rasterizes text, so the output is no longer selectable —
 * we're upfront about that trade-off in the tool UI.
 *
 * @param {File} file
 * @param {{ level: 'low'|'medium'|'high', onProgress?: (done:number,total:number)=>void }} options
 */
export async function compressPdf(file, { level = 'medium', onProgress } = {}) {
  const { scale, quality } = LEVELS[level] || LEVELS.medium

  const pdfjs = await getPdfjs()
  const { PDFDocument } = await import('pdf-lib')

  const srcBytes = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: srcBytes }).promise
  const outDoc = await PDFDocument.create()

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    const jpegBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not compress this page.'))), 'image/jpeg', quality)
    })
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
    const embedded = await outDoc.embedJpg(jpegBytes)

    // Keep the original page's point dimensions so print size is unchanged.
    const originalViewport = page.getViewport({ scale: 1 })
    const outPage = outDoc.addPage([originalViewport.width, originalViewport.height])
    outPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    })

    onProgress?.(i, pdf.numPages)
  }

  const outBytes = await outDoc.save()
  const compressed = new Blob([outBytes], { type: 'application/pdf' })

  // Safety net: if rasterizing somehow produced a larger file (rare, e.g.
  // very text-light PDFs with the "low" setting), fall back to the original.
  if (compressed.size >= file.size) {
    return { blob: file.slice(0, file.size, 'application/pdf'), improved: false }
  }
  return { blob: compressed, improved: true }
}
