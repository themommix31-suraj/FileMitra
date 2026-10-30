/**
 * Splits a PDF into multiple PDFs, one per page range.
 * @param {File} file
 * @param {{ start: number, end: number }[]} ranges 1-based, inclusive
 * @returns {Promise<{ range: string, blob: Blob }[]>}
 */
export async function splitPdf(file, ranges) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const srcPdf = await PDFDocument.load(bytes)
  const total = srcPdf.getPageCount()

  const results = []
  for (const { start, end } of ranges) {
    const from = Math.max(1, Math.min(start, total))
    const to = Math.max(from, Math.min(end, total))
    const indices = []
    for (let i = from; i <= to; i++) indices.push(i - 1)

    const outPdf = await PDFDocument.create()
    const copied = await outPdf.copyPages(srcPdf, indices)
    copied.forEach((p) => outPdf.addPage(p))
    const outBytes = await outPdf.save()
    results.push({ range: from === to ? `${from}` : `${from}-${to}`, blob: new Blob([outBytes], { type: 'application/pdf' }) })
  }
  return results
}

export async function getPdfPageCountLib(file) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdf = await PDFDocument.load(bytes)
  return pdf.getPageCount()
}
