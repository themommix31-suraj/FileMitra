/**
 * Stamps a signature image onto a single chosen page of a PDF, at a
 * fractional position/size. Note: this places a visual signature mark —
 * it is not a cryptographic digital signature and provides no tamper-proof
 * guarantee, which is made clear in the tool's UI.
 * @param {File} file
 * @param {Blob} signatureImageBlob a PNG blob (ideally with transparency)
 * @param {{ pageNumber: number, x: number, y: number, width: number, height: number }} placement fractional (0-1) of the page
 */
export async function signPdf(file, signatureImageBlob, { pageNumber, x, y, width, height }) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  const pages = pdfDoc.getPages()
  const page = pages[pageNumber - 1]
  if (!page) throw new Error('That page number doesn\u2019t exist in this PDF.')

  const sigBytes = await signatureImageBlob.arrayBuffer()
  const embedded = await pdfDoc.embedPng(sigBytes)

  const { width: pw, height: ph } = page.getSize()
  const drawW = width * pw
  const drawH = height * ph

  page.drawImage(embedded, {
    x: x * pw,
    y: ph - y * ph - drawH, // convert from top-left fractional coords to PDF's bottom-left origin
    width: drawW,
    height: drawH,
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
