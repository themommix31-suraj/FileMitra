import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

const MIME_BY_FORMAT = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

/**
 * Rotates an image by a multiple of 90 degrees and/or flips it, via canvas.
 * @param {File} file
 * @param {{ rotate?: 0|90|180|270, flipH?: boolean, flipV?: boolean, format?: string, quality?: number }} options
 */
export async function rotateImage(file, { rotate = 0, flipH = false, flipV = false, format, quality = 0.92 } = {}) {
  const { img, url } = await loadImage(file)
  try {
    const outFormat = format || (file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpeg')
    const swap = rotate === 90 || rotate === 270
    const w = img.naturalWidth
    const h = img.naturalHeight

    const canvas = document.createElement('canvas')
    canvas.width = swap ? h : w
    canvas.height = swap ? w : h
    const ctx = canvas.getContext('2d')
    if (outFormat === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotate * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.drawImage(img, -w / 2, -h / 2, w, h)

    const mime = MIME_BY_FORMAT[outFormat] || 'image/jpeg'
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Rotation failed. The image may be too large for your browser to process.'))),
        mime,
        outFormat === 'png' ? undefined : quality
      )
    })
    return blob
  } finally {
    revokeObjectURL(url)
  }
}
