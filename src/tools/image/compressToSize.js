import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

const MIME = { jpeg: 'image/jpeg', webp: 'image/webp' }
const MIN_QUALITY = 0.05
const MAX_QUALITY = 0.95

function encode(canvas, mime, quality) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, quality))
}

function drawAt(img, scale, flatten) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  if (flatten) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Compresses an image so the output is as close as possible to — but not over —
 * a target file size. First searches for the highest JPEG/WebP quality that fits;
 * if even the lowest quality is too big, the image is scaled down and retried.
 *
 * @param {File} file
 * @param {{ targetBytes: number, format?: 'jpeg'|'webp' }} options
 * @returns {Promise<{ blob: Blob, unchanged: boolean, quality: number, width: number, height: number, scaled: boolean }>}
 */
export async function compressToTargetSize(file, { targetBytes, format = 'jpeg' } = {}) {
  const mime = MIME[format]
  if (!mime) throw new Error(`Unsupported target format: ${format}`)
  if (!targetBytes || targetBytes < 1024) throw new Error('Please choose a target size of at least 1 KB.')

  const { img, url } = await loadImage(file)
  try {
    const flatten = format === 'jpeg'
    const fullW = img.naturalWidth
    const fullH = img.naturalHeight

    // Already small enough and in the requested format family — leave it alone.
    if (file.size <= targetBytes && file.type === mime) {
      return { blob: file, unchanged: true, quality: 1, width: fullW, height: fullH, scaled: false }
    }

    let scale = 1
    for (let attempt = 0; attempt < 10; attempt++) {
      const canvas = drawAt(img, scale, flatten)

      // Even the lowest quality too big? Shrink the image proportionally to the overshoot.
      const smallest = await encode(canvas, mime, MIN_QUALITY)
      if (!smallest) throw new Error('Compression failed. Your browser may not support this output format.')
      if (smallest.size > targetBytes) {
        const factor = Math.max(0.1, Math.min(0.9, Math.sqrt(targetBytes / smallest.size) * 0.95))
        scale *= factor
        if (Math.min(fullW, fullH) * scale < 16) break
        continue
      }

      // Highest quality that still fits: try the top first, then bisect.
      const best = await encode(canvas, mime, MAX_QUALITY)
      let result = { blob: best, quality: MAX_QUALITY }
      if (best.size > targetBytes) {
        let lo = MIN_QUALITY
        let hi = MAX_QUALITY
        result = { blob: smallest, quality: MIN_QUALITY }
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2
          const blob = await encode(canvas, mime, mid)
          if (blob.size <= targetBytes) {
            result = { blob, quality: mid }
            lo = mid
          } else {
            hi = mid
          }
        }
      }
      return { ...result, unchanged: false, width: canvas.width, height: canvas.height, scaled: scale < 1 }
    }
    throw new Error('Could not reach this size without making the image too small. Try a larger target size.')
  } finally {
    revokeObjectURL(url)
  }
}
