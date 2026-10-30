import { getPdfjs } from './pdfjsClient'

/**
 * Renders every page (or a chosen subset) of a PDF to JPG blobs, on-device.
 * @param {File} file
 * @param {{ pages?: number[], scale?: number, quality?: number, onProgress?: (done:number,total:number)=>void }} options
 * @returns {Promise<{ pageNumber: number, blob: Blob }[]>}
 */
export async function pdfToImages(file, { pages, scale = 1.5, quality = 0.9, format = 'jpeg', onProgress } = {}) {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
  const pdfjs = await getPdfjs()
  const bytes = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: bytes }).promise

  const pageNumbers = pages && pages.length ? pages : Array.from({ length: pdf.numPages }, (_, i) => i + 1)
  const results = []

  for (let i = 0; i < pageNumbers.length; i++) {
    const pageNumber = pageNumbers[i]
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')

    await page.render({ canvasContext: ctx, viewport }).promise

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render this page to an image.'))), mimeType, format === 'png' ? undefined : quality)
    })

    results.push({ pageNumber, blob })
    onProgress?.(i + 1, pageNumbers.length)
  }

  return results
}

export async function getPdfPageCount(file) {
  const pdfjs = await getPdfjs()
  const bytes = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: bytes }).promise
  return pdf.numPages
}

export async function getPdfThumbnails(file, { scale = 0.35, quality = 0.7 } = {}) {
  const images = await pdfToImages(file, { scale, quality })
  return images.map(({ pageNumber, blob }) => ({ pageNumber, url: URL.createObjectURL(blob) }))
}
