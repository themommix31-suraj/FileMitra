import { pdfToImages, getPdfPageCount } from './pdfToJpg'

let tesseractPromise = null

/**
 * Lazily imports tesseract.js. Only ever loaded on the PDF OCR tool page —
 * it pulls in a WASM engine and downloads trained-data files on first use.
 */
async function getTesseract() {
  if (!tesseractPromise) {
    tesseractPromise = import('tesseract.js')
  }
  return tesseractPromise
}

/**
 * Runs OCR on every page of a PDF (or a scanned/image-only PDF with no
 * selectable text) entirely on-device: each page is rasterized to an image
 * with pdf.js, then read with Tesseract's WASM OCR engine. Nothing is
 * uploaded anywhere — only the OCR language data is fetched from a CDN on
 * first use and cached by the browser afterwards.
 * @param {File} file
 * @param {{ lang?: string, onProgress?: (done:number, total:number, stage:string) => void }} options
 * @returns {Promise<{ pageNumber: number, text: string }[]>}
 */
export async function ocrPdf(file, { lang = 'eng', onProgress } = {}) {
  const Tesseract = await getTesseract()
  const totalPages = await getPdfPageCount(file)
  if (totalPages > 25) {
    throw new Error('This PDF has too many pages for in-browser OCR (max 25). Try splitting it first.')
  }

  const worker = await Tesseract.createWorker(lang, undefined, {
    logger: () => {}, // per-page progress is reported below instead
  })

  try {
    const results = []
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.(pageNumber - 1, totalPages, 'rendering')
      const [{ blob }] = await pdfToImages(file, { pages: [pageNumber], scale: 2, format: 'png' })

      onProgress?.(pageNumber - 1, totalPages, 'reading')
      const {
        data: { text },
      } = await worker.recognize(blob)

      results.push({ pageNumber, text: text.trim() })
      onProgress?.(pageNumber, totalPages, 'done')
    }
    return results
  } finally {
    await worker.terminate()
  }
}

export function ocrResultToText(pages) {
  return pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text || '(no text found)'}`).join('\n\n')
}
