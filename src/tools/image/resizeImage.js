import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

const MIME_BY_FORMAT = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/**
 * Resizes an image to the given pixel dimensions using the Canvas API.
 * @param {File} file
 * @param {{ width: number, height: number, format: string, quality: number }} options
 */
export async function resizeImage(file, { width, height, format = 'jpeg', quality = 0.85 } = {}) {
  const { img, url } = await loadImage(file)
  try {
    const targetW = Math.max(1, Math.round(width))
    const targetH = Math.max(1, Math.round(height))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, targetW, targetH)
    }
    ctx.drawImage(img, 0, 0, targetW, targetH)

    const mime = MIME_BY_FORMAT[format] || 'image/jpeg'
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Resize failed. The image may be too large for your browser to process.'))),
        mime,
        format === 'png' ? undefined : quality
      )
    })
    return blob
  } finally {
    revokeObjectURL(url)
  }
}

export function getImageDimensions(file) {
  return loadImage(file).then(({ img, url }) => {
    revokeObjectURL(url)
    return { width: img.naturalWidth, height: img.naturalHeight }
  })
}
