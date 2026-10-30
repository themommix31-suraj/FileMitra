/**
 * Rotates every page of a PDF by a multiple of 90 degrees.
 * @param {File} file
 * @param {{ degrees: 90|180|270 }} options
 */
export async function rotatePdf(file, { degrees = 90 } = {}) {
  const { PDFDocument, degrees: mkDegrees } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)

  pdfDoc.getPages().forEach((page) => {
    const current = page.getRotation().angle
    page.setRotation(mkDegrees((current + degrees) % 360))
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
