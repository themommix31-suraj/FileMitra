const POSITIONS = {
  'bottom-center': (pw, ph, textWidth, margin) => ({ x: (pw - textWidth) / 2, y: margin }),
  'bottom-right': (pw, ph, textWidth, margin) => ({ x: pw - textWidth - margin, y: margin }),
  'bottom-left': (pw, ph, textWidth, margin) => ({ x: margin, y: margin }),
  'top-center': (pw, ph, textWidth, margin) => ({ x: (pw - textWidth) / 2, y: ph - margin }),
  'top-right': (pw, ph, textWidth, margin) => ({ x: pw - textWidth - margin, y: ph - margin }),
  'top-left': (pw, ph, textWidth, margin) => ({ x: margin, y: ph - margin }),
}

/**
 * Draws "Page N" style numbering onto every page of a PDF.
 * @param {File} file
 * @param {{ position?: keyof typeof POSITIONS, startAt?: number, format?: string, fontSize?: number }} options
 *   format supports {n} for the page number and {total} for the page count.
 */
export async function addPageNumbers(file, { position = 'bottom-center', startAt = 1, format = '{n}', fontSize = 11 } = {}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()
  const total = pages.length
  const margin = 28
  const place = POSITIONS[position] || POSITIONS['bottom-center']

  pages.forEach((page, i) => {
    const { width, height } = page.getSize()
    const label = format.replace('{n}', String(i + startAt)).replace('{total}', String(total))
    const textWidth = font.widthOfTextAtSize(label, fontSize)
    const { x, y } = place(width, height, textWidth, margin)
    page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.25) })
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
