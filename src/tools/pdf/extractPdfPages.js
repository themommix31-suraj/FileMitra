/**
 * Extracts the given 1-based page numbers into a new PDF, in the order given.
 * @param {File} file
 * @param {number[]} pageNumbers
 */
export async function extractPdfPages(file, pageNumbers) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const srcPdf = await PDFDocument.load(bytes)
  const total = srcPdf.getPageCount()
  const indices = pageNumbers.filter((n) => n >= 1 && n <= total).map((n) => n - 1)

  if (indices.length === 0) {
    throw new Error('Select at least one valid page to extract.')
  }

  const outPdf = await PDFDocument.create()
  const copied = await outPdf.copyPages(srcPdf, indices)
  copied.forEach((p) => outPdf.addPage(p))
  const outBytes = await outPdf.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
