/**
 * Builds a new PDF from the given page list: reordered, optionally rotated,
 * with any pages not listed removed.
 * @param {File} file
 * @param {{ index: number, rotation?: number }[]} pages index is the 0-based page in the ORIGINAL file;
 *   rotation is extra clockwise degrees (0, 90, 180, 270).
 * @returns {Promise<Blob>}
 */
export async function organizePdf(file, pages) {
  if (!pages.length) throw new Error('Keep at least one page in the document.')
  const { PDFDocument, degrees } = await import('pdf-lib')

  let src
  try {
    src = await PDFDocument.load(await file.arrayBuffer())
  } catch {
    throw new Error('Could not read this PDF. It may be password-protected or corrupt.')
  }

  const out = await PDFDocument.create()
  const copied = await out.copyPages(src, pages.map((p) => p.index))
  copied.forEach((page, i) => {
    const extra = ((pages[i].rotation || 0) % 360 + 360) % 360
    if (extra) page.setRotation(degrees((page.getRotation().angle + extra) % 360))
    out.addPage(page)
  })
  return new Blob([await out.save()], { type: 'application/pdf' })
}
