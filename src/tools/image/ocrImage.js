/**
 * Extracts text from an image (photo of a document, screenshot, scan…) using
 * Tesseract's WASM OCR engine, entirely on-device. Only the language data is
 * fetched from a CDN on first use (then cached by the browser).
 * Tesseract is imported lazily so it never touches the main bundle.
 * @param {File|Blob} file
 * @param {{ lang?: string, onProgress?: (percent:number, stage:string) => void }} options
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function ocrImage(file, { lang = 'eng', onProgress } = {}) {
  let worker
  try {
    const Tesseract = await import('tesseract.js')
    worker = await Tesseract.createWorker(lang, undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100), 'Reading text…')
        else if (m.status) onProgress?.(null, 'Preparing OCR engine…')
      },
    })
  } catch {
    const err = new Error('Could not load the text-recognition engine. Please check your internet connection and try again — it downloads a small language file the first time you use it.')
    err.code = 'OCR_LOAD'
    throw err
  }
  try {
    const { data } = await worker.recognize(file)
    return { text: (data.text || '').trim(), confidence: Math.round(data.confidence || 0) }
  } finally {
    await worker.terminate()
  }
}
