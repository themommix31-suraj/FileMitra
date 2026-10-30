/**
 * Crops every page of a PDF by trimming a margin (in points) from each
 * edge. Sets both the CropBox and MediaBox so the trim is respected by
 * every viewer and by any tool that re-renders the pages.
 * @param {File} file
 * @param {{ top: number, bottom: number, left: number, right: number }} margins in points
 */
export async function cropPdfPages(file, { top = 0, bottom = 0, left = 0, right = 0 } = {}) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)

  pdfDoc.getPages().forEach((page) => {
    const { width, height } = page.getSize()
    const newWidth = Math.max(1, width - left - right)
    const newHeight = Math.max(1, height - top - bottom)
    if (newWidth >= width && newHeight >= height) return
    page.setCropBox(left, bottom, newWidth, newHeight)
    page.setMediaBox(left, bottom, newWidth, newHeight)
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
