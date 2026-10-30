import { getPdfjs } from './pdfjsClient'

/*
 * Two ways to shrink a PDF:
 *
 *  1. "smart"   – re-encode the JPEG images embedded in the PDF at a lower quality / size.
 *                 Text, links and vector graphics are untouched (text stays selectable).
 *  2. "maximum" – render every page to a JPEG and rebuild the PDF from those pictures.
 *                 Smallest result, but text is no longer selectable.
 *
 * `compressPdf` runs one of them for a chosen level; `compressPdfToSize` tries
 * progressively stronger settings (smart first, then maximum) until the file fits.
 */

const SMART_LEVELS = {
  low: { quality: 0.85, maxDim: 3000 },
  medium: { quality: 0.7, maxDim: 2000 },
  high: { quality: 0.5, maxDim: 1400 },
}
const RASTER_LEVELS = {
  low: { scale: 2.0, quality: 0.85 },
  medium: { scale: 1.5, quality: 0.65 },
  high: { scale: 1.1, quality: 0.45 },
}
const SMART_LADDER = [
  { quality: 0.8, maxDim: 2400 },
  { quality: 0.65, maxDim: 1800 },
  { quality: 0.5, maxDim: 1400 },
  { quality: 0.4, maxDim: 1100 },
  { quality: 0.32, maxDim: 850 },
]
const RASTER_LADDER = [
  { scale: 1.3, quality: 0.6 },
  { scale: 1.1, quality: 0.5 },
  { scale: 0.95, quality: 0.45 },
  { scale: 0.8, quality: 0.4 },
  { scale: 0.65, quality: 0.35 },
  { scale: 0.5, quality: 0.3 },
]

const toBlob = (canvas, quality) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not compress this page.'))), 'image/jpeg', quality))

/* ---------------- smart: recompress embedded JPEGs ---------------- */

/**
 * @returns {Promise<{ blob: Blob, imagesFound: number, imagesShrunk: number }>}
 */
export async function recompressPdfImages(file, { quality, maxDim }, onStep) {
  const { PDFDocument, PDFName, PDFRawStream, PDFArray } = await import('pdf-lib')
  const doc = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false })
  const context = doc.context

  const N = (name) => PDFName.of(name)
  const isDct = (filter) => filter === N('DCTDecode') || (filter instanceof PDFArray && filter.size() === 1 && filter.get(0) === N('DCTDecode'))
  const targets = []
  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    const d = obj.dict
    if (d.get(N('Subtype')) !== N('Image') || !isDct(d.get(N('Filter')))) continue
    const cs = d.get(N('ColorSpace'))
    if (cs !== N('DeviceRGB') && cs !== N('DeviceGray')) continue // CMYK / ICC / indexed: leave alone
    if (d.has(N('Mask')) || d.has(N('Decode'))) continue
    targets.push([ref, obj])
  }

  let shrunk = 0
  for (let i = 0; i < targets.length; i++) {
    const [ref, obj] = targets[i]
    onStep?.(i, targets.length)
    try {
      const w0 = obj.dict.get(N('Width')).asNumber()
      const h0 = obj.dict.get(N('Height')).asNumber()
      const bitmap = await createImageBitmap(new Blob([obj.contents], { type: 'image/jpeg' }), { imageOrientation: 'none' })
      if (bitmap.width !== w0 || bitmap.height !== h0) {
        bitmap.close?.()
        continue // browser rotated it (EXIF) — don't risk changing how it appears
      }
      const scale = Math.min(1, maxDim / Math.max(w0, h0))
      const w = Math.max(1, Math.round(w0 * scale))
      const h = Math.max(1, Math.round(h0 * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, 0, 0, w, h)
      bitmap.close?.()
      const out = new Uint8Array(await (await toBlob(canvas, quality)).arrayBuffer())
      if (out.length >= obj.contents.length * 0.92) continue // not worth replacing

      const dict = context.obj({ Type: 'XObject', Subtype: 'Image', Width: w, Height: h, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode' })
      const smask = obj.dict.get(N('SMask'))
      if (smask) dict.set(N('SMask'), smask)
      context.assign(ref, PDFRawStream.of(dict, out))
      shrunk += 1
    } catch {
      /* an image the browser can't decode — keep the original */
    }
  }
  onStep?.(targets.length, targets.length)

  const bytes = await doc.save({ useObjectStreams: true })
  return { blob: new Blob([bytes], { type: 'application/pdf' }), imagesFound: targets.length, imagesShrunk: shrunk }
}

/* ---------------- maximum: rasterize pages ---------------- */

export async function rasterizePdf(file, { scale, quality }, onPage) {
  const pdfjs = await getPdfjs()
  const { PDFDocument } = await import('pdf-lib')
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const outDoc = await PDFDocument.create()

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

    const embedded = await outDoc.embedJpg(new Uint8Array(await (await toBlob(canvas, quality)).arrayBuffer()))
    const original = page.getViewport({ scale: 1 }) // keep the original page size so print size is unchanged
    outDoc.addPage([original.width, original.height]).drawImage(embedded, { x: 0, y: 0, width: original.width, height: original.height })
    page.cleanup?.()
    onPage?.(i, pdf.numPages)
  }
  return new Blob([await outDoc.save()], { type: 'application/pdf' })
}

/* ---------------- public API ---------------- */

const unchanged = (file, note) => ({ blob: file.slice(0, file.size, 'application/pdf'), improved: false, method: 'none', note, reached: true })

/**
 * @param {File} file
 * @param {{ mode?: 'smart'|'maximum', level?: 'low'|'medium'|'high', onProgress?: (percent:number, label:string) => void }} options
 */
export async function compressPdf(file, { mode = 'smart', level = 'medium', onProgress } = {}) {
  let blob
  let method
  if (mode === 'maximum') {
    blob = await rasterizePdf(file, RASTER_LEVELS[level] || RASTER_LEVELS.medium, (done, total) => onProgress?.((done / total) * 100, 'Compressing pages…'))
    method = 'flattened'
  } else {
    const r = await recompressPdfImages(file, SMART_LEVELS[level] || SMART_LEVELS.medium, (done, total) => onProgress?.(total ? (done / total) * 100 : 100, 'Compressing images…'))
    blob = r.blob
    method = 'images'
    if (r.imagesFound === 0 && blob.size >= file.size) {
      return unchanged(file, 'This PDF has no photos or scans to compress, so it is already as small as it can get without flattening it. Try “Maximum compression” if you can accept non-selectable text.')
    }
  }
  if (blob.size >= file.size) return unchanged(file, 'This PDF is already well optimised — compressing it further did not reduce the size, so the original was kept.')
  return { blob, improved: true, method, note: null, reached: true }
}

/**
 * Finds a setting that brings the PDF under `targetBytes`: first keeping text
 * (image recompression), then — only if needed — flattening pages to images.
 */
export async function compressPdfToSize(file, targetBytes, { onProgress } = {}) {
  if (file.size <= targetBytes) return unchanged(file, 'This PDF is already under the target size.')

  const totalSteps = SMART_LADDER.length + RASTER_LADDER.length
  let step = 0
  let best = null
  const consider = (blob, method) => {
    if (!best || blob.size < best.blob.size) best = { blob, method }
  }
  const tick = (label) => onProgress?.((step / totalSteps) * 100, label)

  // 1) keep text: recompress images with stronger and stronger settings
  for (const settings of SMART_LADDER) {
    tick('Compressing images…')
    const r = await recompressPdfImages(file, settings)
    step += 1
    if (r.imagesFound === 0) {
      step = SMART_LADDER.length // nothing to gain from the remaining image steps
      break
    }
    consider(r.blob, 'images')
    if (r.blob.size <= targetBytes) return { blob: r.blob, improved: true, method: 'images', note: null, reached: true }
  }

  // 2) last resort: flatten pages to images
  for (const settings of RASTER_LADDER) {
    tick('Flattening pages to reach the size…')
    const blob = await rasterizePdf(file, settings)
    step += 1
    consider(blob, 'flattened')
    if (blob.size <= targetBytes) return { blob, improved: true, method: 'flattened', note: null, reached: true }
  }

  if (best && best.blob.size < file.size) return { blob: best.blob, improved: true, method: best.method, note: null, reached: false }
  return { ...unchanged(file, 'Could not make this PDF smaller.'), reached: false }
}
