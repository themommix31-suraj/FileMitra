import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

const MIME_BY_FORMAT = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

/**
 * Crops an image to a pixel rectangle using the Canvas API.
 * @param {File} file
 * @param {{ x: number, y: number, width: number, height: number, format?: string, quality?: number }} options
 */
export async function cropImage(file, { x, y, width, height, format, quality = 0.92 } = {}) {
  const { img, url } = await loadImage(file)
  try {
    const outFormat = format || (file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpeg')
    const cw = Math.max(1, Math.round(width))
    const ch = Math.max(1, Math.round(height))

    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (outFormat === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, cw, ch)
    }
    ctx.drawImage(img, Math.round(x), Math.round(y), cw, ch, 0, 0, cw, ch)

    const mime = MIME_BY_FORMAT[outFormat] || 'image/jpeg'
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Crop failed. The image may be too large for your browser to process.'))),
        mime,
        outFormat === 'png' ? undefined : quality
      )
    })
    return blob
  } finally {
    revokeObjectURL(url)
  }
}
