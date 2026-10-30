/**
 * "Repairs" a PDF by re-parsing it as leniently as possible and rebuilding
 * a fresh, well-formed PDF from the recovered pages. This fixes the most
 * common real-world corruption cases (bad xref tables, broken trailers,
 * truncated cross-reference streams) since pdf-lib rebuilds those
 * structures from scratch on save. It can't recover data that's truly
 * missing from the file, only reconstruct valid structure around what's
 * still there.
 * @param {File} file
 */
export async function repairPdf(file) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()

  let srcPdf
  try {
    srcPdf = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false, updateMetadata: false })
  } catch {
    throw new Error('This PDF is too damaged to repair automatically. Some files with severe corruption can\u2019t be recovered in the browser.')
  }

  const outPdf = await PDFDocument.create()
  const pageIndices = srcPdf.getPageIndices()
  if (pageIndices.length === 0) {
    throw new Error('No readable pages were found in this PDF.')
  }

  const copiedPages = await outPdf.copyPages(srcPdf, pageIndices)
  copiedPages.forEach((page) => outPdf.addPage(page))

  const outBytes = await outPdf.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
