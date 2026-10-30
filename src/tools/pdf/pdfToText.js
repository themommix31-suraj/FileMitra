import { getPdfjs } from './pdfjsClient'

/**
 * Extracts plain text from every page of a PDF, on-device via pdf.js.
 * @param {File} file
 * @param {{ onProgress?: (done:number,total:number)=>void }} options
 * @returns {Promise<string>}
 */
export async function pdfToText(file, { onProgress } = {}) {
  const pdfjs = await getPdfjs()
  const bytes = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: bytes }).promise

  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push(text.trim())
    onProgress?.(i, pdf.numPages)
  }

  const combined = pages.join('\n\n')
  if (!combined.trim()) {
    throw new Error('No selectable text was found in this PDF — it may be a scanned image without OCR.')
  }
  return combined
}
