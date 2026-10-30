/**
 * Removes the given 1-based page numbers from a PDF.
 * @param {File} file
 * @param {number[]} pageNumbers
 */
export async function deletePdfPages(file, pageNumbers) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  const total = pdfDoc.getPageCount()
  const toRemove = new Set(pageNumbers.filter((n) => n >= 1 && n <= total))

  if (toRemove.size >= total) {
    throw new Error('You can\u2019t delete every page — at least one page must remain.')
  }

  // Remove from highest index to lowest so indices stay valid as we go.
  Array.from(toRemove)
    .sort((a, b) => b - a)
    .forEach((n) => pdfDoc.removePage(n - 1))

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
