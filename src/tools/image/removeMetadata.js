import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

const MIME_BY_FORMAT = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const FORMAT_BY_MIME = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' }

/**
 * Strips EXIF/GPS/metadata from an image by re-drawing it onto a canvas and
 * re-encoding it in its original format. Canvas re-encoding never carries
 * EXIF data over, so this is a reliable (and fully on-device) way to remove it.
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export async function removeImageMetadata(file) {
  const { img, url } = await loadImage(file)
  try {
    const format = FORMAT_BY_MIME[file.type] || 'jpeg'
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0)

    const mime = MIME_BY_FORMAT[format]
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Could not process this image.'))),
        mime,
        format === 'png' ? undefined : 0.95
      )
    })
    return blob
  } finally {
    revokeObjectURL(url)
  }
}
