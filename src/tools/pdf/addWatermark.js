/**
 * Stamps a repeated, semi-transparent, rotated text watermark onto every
 * page of a PDF.
 * @param {File} file
 * @param {{ text: string, opacity?: number, rotation?: number, fontSize?: number, color?: string }} options
 */
export async function addWatermark(file, { text, opacity = 0.25, rotation = 45, fontSize = 48, color = '#64748b' } = {}) {
  if (!text?.trim()) throw new Error('Enter some watermark text first.')

  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  pdfDoc.getPages().forEach((page) => {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(rotation),
    })
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
