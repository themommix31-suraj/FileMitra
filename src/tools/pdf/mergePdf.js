/**
 * Merges an ordered list of PDF Files into one PDF.
 * @param {File[]} files
 */
export async function mergePdfs(files) {
  const { PDFDocument } = await import('pdf-lib')
  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    let sourcePdf
    try {
      sourcePdf = await PDFDocument.load(bytes)
    } catch {
      throw new Error(`"${file.name}" doesn't look like a valid PDF and could not be merged.`)
    }
    const pageIndices = sourcePdf.getPageIndices()
    const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices)
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }

  const bytes = await mergedPdf.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
