import { getPdfjs } from './pdfjsClient'

/**
 * Permanently redacts regions of a PDF by rasterizing each page to an
 * image and drawing solid black boxes over the redacted areas, then
 * rebuilding the PDF from those images. Rasterizing (rather than just
 * drawing a shape over live content) guarantees no selectable text or
 * hidden layers remain underneath the redaction.
 * @param {File} file
 * @param {Record<number, {x:number,y:number,w:number,h:number}[]>} boxesByPage
 *   fractional (0-1) coordinates relative to each page, keyed by 1-based page number
 * @param {{ scale?: number, onProgress?: (done:number,total:number)=>void }} options
 */
export async function redactPdf(file, boxesByPage, { scale = 2, onProgress } = {}) {
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

    const boxes = boxesByPage[i] || []
    ctx.fillStyle = '#000000'
    boxes.forEach((b) => {
      ctx.fillRect(b.x * canvas.width, b.y * canvas.height, b.w * canvas.width, b.h * canvas.height)
    })

    const jpegBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process this page.'))), 'image/jpeg', 0.92)
    })
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
    const embedded = await outDoc.embedJpg(jpegBytes)

    const originalViewport = page.getViewport({ scale: 1 })
    const outPage = outDoc.addPage([originalViewport.width, originalViewport.height])
    outPage.drawImage(embedded, { x: 0, y: 0, width: originalViewport.width, height: originalViewport.height })

    onProgress?.(i, pdf.numPages)
  }

  const outBytes = await outDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
