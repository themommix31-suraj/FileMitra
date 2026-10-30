import { revokeObjectURL } from '../../utils/fileUtils'
import { loadSvgImage } from './svgUtils'

const MAX_EDGE = 8192
const MIME = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }

/**
 * Rasterizes an SVG file to PNG / JPG / WebP.
 * @param {File} file
 * @param {{ format?: 'png'|'jpeg'|'webp', scale?: number, width?: number, background?: string|null, quality?: number }} options
 *   `width` (px) wins over `scale`. `background` is a CSS colour, or null for transparent
 *   (JPG always gets a background — white if none is given).
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function svgToImage(file, { format = 'png', scale = 2, width, background = null, quality = 0.92 } = {}) {
  const mime = MIME[format]
  if (!mime) throw new Error(`Unsupported target format: ${format}`)

  const { img, url, width: baseW, height: baseH } = await loadSvgImage(file)
  try {
    let factor = width ? width / baseW : scale
    factor = Math.min(factor, MAX_EDGE / Math.max(baseW, baseH))
    const outW = Math.max(1, Math.round(baseW * factor))
    const outH = Math.max(1, Math.round(baseH * factor))

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')

    const fill = background || (format === 'jpeg' ? '#ffffff' : null)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fillRect(0, 0, outW, outH)
    }
    ctx.drawImage(img, 0, 0, outW, outH)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Conversion failed. The image may be too large for your browser.'))),
        mime,
        format === 'png' ? undefined : quality
      )
    })
    return { blob, width: outW, height: outH }
  } finally {
    revokeObjectURL(url)
  }
}
