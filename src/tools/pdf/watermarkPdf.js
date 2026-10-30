/**
 * Stamps a text watermark diagonally across every page of a PDF.
 * @param {File} file
 * @param {{ text: string, opacity?: number, fontSize?: number, rotate?: number, color?: [number,number,number] }} options
 */
export async function addTextWatermark(file, { text, opacity = 0.25, fontSize = 48, rotate = 45, color = [0.4, 0.4, 0.45] } = {}) {
  if (!text || !text.trim()) throw new Error('Enter some watermark text first.')

  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  pdfDoc.getPages().forEach((page) => {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(...color),
      opacity,
      rotate: degrees(rotate),
    })
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}

/**
 * Stamps an image watermark, tiled once centered on every page.
 * @param {File} file
 * @param {File} imageFile
 * @param {{ opacity?: number, scale?: number }} options scale is relative to page width (0-1)
 */
export async function addImageWatermark(file, imageFile, { opacity = 0.3, scale = 0.4 } = {}) {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)

  const imgBytes = await imageFile.arrayBuffer()
  const embedded = imageFile.type === 'image/png' ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes)

  pdfDoc.getPages().forEach((page) => {
    const { width, height } = page.getSize()
    const targetW = width * scale
    const ratio = embedded.height / embedded.width
    const targetH = targetW * ratio
    page.drawImage(embedded, {
      x: (width - targetW) / 2,
      y: (height - targetH) / 2,
      width: targetW,
      height: targetH,
      opacity,
    })
  })

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}
