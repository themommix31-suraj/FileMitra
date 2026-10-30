const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  fit: null, // page sized to match each image
}

/**
 * Combines an ordered list of image Files into a single PDF.
 * Lazy-loads pdf-lib so it's never fetched on non-PDF pages.
 * @param {File[]} files
 * @param {{ pageSize: 'a4'|'letter'|'fit', orientation: 'portrait'|'landscape', margin: number }} options
 */
export async function imagesToPdf(files, { pageSize = 'a4', orientation = 'portrait', margin = 24 } = {}) {
  const { PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    let embedded
    if (file.type === 'image/png') {
      embedded = await pdfDoc.embedPng(bytes)
    } else {
      // JPEG (and any other type we've already validated as image/jpeg) embeds as JPG.
      embedded = await pdfDoc.embedJpg(bytes)
    }

    const imgDims = embedded.scale(1)
    let pageWH = PAGE_SIZES[pageSize]

    if (!pageWH) {
      pageWH = [imgDims.width + margin * 2, imgDims.height + margin * 2]
    } else if (orientation === 'landscape') {
      pageWH = [pageWH[1], pageWH[0]]
    }

    const page = pdfDoc.addPage(pageWH)
    const [pw, ph] = pageWH
    const maxW = pw - margin * 2
    const maxH = ph - margin * 2
    const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1)
    const drawW = imgDims.width * scale
    const drawH = imgDims.height * scale

    page.drawImage(embedded, {
      x: (pw - drawW) / 2,
      y: (ph - drawH) / 2,
      width: drawW,
      height: drawH,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}
