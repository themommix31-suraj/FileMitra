const POSITIONS = {
  'bottom-center': (pw, ph, textW, margin) => ({ x: (pw - textW) / 2, y: margin }),
  'bottom-right': (pw, ph, textW, margin) => ({ x: pw - textW - margin, y: margin }),
  'bottom-left': (pw, ph, textW, margin) => ({ x: margin, y: margin }),
  'top-center': (pw, ph, textW, margin) => ({ x: (pw - textW) / 2, y: ph - margin }),
  'top-right': (pw, ph, textW, margin) => ({ x: pw - textW - margin, y: ph - margin }),
  'top-left': (pw, ph, textW, margin) => ({ x: margin, y: ph - margin }),
}

/**
 * Draws page numbers onto every page of a PDF.
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
  const place = POSITIONS[position] || POSITIONS['bottom-center']
  const margin = 28

  pages.forEach((page, i) => {
    const { width, height } = page.getSize()
    const text = format.replace('{n}', String(startAt + i)).replace('{total}', String(total))
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    const { x, y } = place(width, height, textWidth, margin)
    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.18) })
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
