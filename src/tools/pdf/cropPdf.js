/**
 * Crops every page of a PDF by trimming a margin (in points) from each edge.
 * Uses the PDF's crop box, which is non-destructive to the underlying
 * content stream — viewers simply won't render outside it.
 * @param {File} file
 * @param {{ top: number, bottom: number, left: number, right: number }} margins in points
 */
export async function cropPdf(file, { top = 0, bottom = 0, left = 0, right = 0 } = {}) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)

  pdfDoc.getPages().forEach((page) => {
    const { width, height } = page.getSize()
    const newWidth = Math.max(10, width - left - right)
    const newHeight = Math.max(10, height - top - bottom)
    page.setCropBox(left, bottom, newWidth, newHeight)
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
