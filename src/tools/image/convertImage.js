import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

export const OUTPUT_FORMATS = {
  jpeg: { mime: 'image/jpeg', ext: '.jpg', label: 'JPG', lossy: true, hasAlpha: false },
  png: { mime: 'image/png', ext: '.png', label: 'PNG', lossy: false, hasAlpha: true },
  webp: { mime: 'image/webp', ext: '.webp', label: 'WebP', lossy: true, hasAlpha: true },
  bmp: { mime: 'image/bmp', ext: '.bmp', label: 'BMP', lossy: false, hasAlpha: false },
}

/** 24-bit BMP encoder (browsers can't encode BMP natively through canvas). */
function encodeBmp(canvas) {
  const w = canvas.width
  const h = canvas.height
  const { data } = canvas.getContext('2d').getImageData(0, 0, w, h)
  const rowSize = Math.ceil((w * 3) / 4) * 4
  const pixelBytes = rowSize * h
  const buf = new ArrayBuffer(54 + pixelBytes)
  const v = new DataView(buf)
  v.setUint8(0, 0x42) // 'B'
  v.setUint8(1, 0x4d) // 'M'
  v.setUint32(2, 54 + pixelBytes, true)
  v.setUint32(10, 54, true)
  v.setUint32(14, 40, true)
  v.setInt32(18, w, true)
  v.setInt32(22, h, true)
  v.setUint16(26, 1, true)
  v.setUint16(28, 24, true)
  v.setUint32(34, pixelBytes, true)
  v.setUint32(38, 2835, true)
  v.setUint32(42, 2835, true)
  const out = new Uint8Array(buf)
  for (let y = 0; y < h; y++) {
    let src = (h - 1 - y) * w * 4 // BMP rows are stored bottom-up
    let dst = 54 + y * rowSize
    for (let x = 0; x < w; x++) {
      out[dst++] = data[src + 2] // B
      out[dst++] = data[src + 1] // G
      out[dst++] = data[src] // R
      src += 4
    }
  }
  return new Blob([buf], { type: 'image/bmp' })
}

/**
 * Converts an image (JPG, PNG, WebP, GIF, BMP, AVIF — anything the browser can
 * decode) to another format via canvas re-encoding.
 * @param {File} file
 * @param {{ to: 'jpeg'|'png'|'webp'|'bmp', quality?: number }} options
 */
export async function convertImage(file, { to, quality = 0.9 } = {}) {
  const target = OUTPUT_FORMATS[to]
  if (!target) throw new Error(`Unsupported target format: ${to}`)

  const { img, url } = await loadImage(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')

    if (!target.hasAlpha) {
      // JPG/BMP have no alpha channel — flatten onto white.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0)

    if (to === 'bmp') return encodeBmp(canvas)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Conversion failed. Your browser may not support this output format.'))),
        target.mime,
        target.lossy ? quality : undefined
      )
    })
    // Some browsers silently fall back to PNG when they can't encode a format.
    if (blob.type !== target.mime) {
      throw new Error('Conversion failed. Your browser may not support this output format.')
    }
    return blob
  } finally {
    revokeObjectURL(url)
  }
}
