import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

const MIME_BY_FORMAT = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/**
 * Compresses an image using the Canvas API's toBlob quality parameter.
 * Runs entirely in the browser — the file is never uploaded anywhere.
 *
 * @param {File} file
 * @param {{ quality: number, format: 'jpeg'|'png'|'webp' }} options quality is 0-1
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, { quality = 0.7, format = 'jpeg' } = {}) {
  const { img, url } = await loadImage(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')

    // PNG has no alpha issue when flattening to JPEG; fill white behind transparency.
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0)

    const mime = MIME_BY_FORMAT[format] || 'image/jpeg'
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Compression failed. The image may be too large for your browser to process.'))),
        mime,
        format === 'png' ? undefined : quality
      )
    })
    return blob
  } finally {
    revokeObjectURL(url)
  }
}
