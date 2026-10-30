const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] }

/**
 * Turns plain text into a simple formatted PDF, wrapping lines to fit the
 * page width and paginating automatically.
 * @param {string} text
 * @param {{ pageSize?: 'a4'|'letter', fontSize?: number }} options
 */
export async function textToPdf(text, { pageSize = 'a4', fontSize = 12 } = {}) {
  const { PDFDocument, StandardFonts } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const [pw, ph] = PAGE_SIZES[pageSize] || PAGE_SIZES.a4
  const margin = 56
  const maxWidth = pw - margin * 2
  const lineHeight = fontSize * 1.4

  // Wrap on explicit newlines first, then wrap each paragraph to fit maxWidth.
  const rawLines = (text || '').split('\n')
  const lines = []
  for (const raw of rawLines) {
    if (raw.trim() === '') {
      lines.push('')
      continue
    }
    const words = raw.split(' ')
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    }
    lines.push(current)
  }

  let page = pdfDoc.addPage([pw, ph])
  let y = ph - margin

  for (const line of lines) {
    if (y < margin) {
      page = pdfDoc.addPage([pw, ph])
      y = ph - margin
    }
    if (line) page.drawText(line, { x: margin, y, size: fontSize, font })
    y -= lineHeight
  }

  const bytes = await pdfDoc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
