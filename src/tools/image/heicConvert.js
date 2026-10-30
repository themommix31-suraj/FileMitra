import { convertImage } from './convertImage'

const MIME = { jpeg: 'image/jpeg', png: 'image/png' }

/**
 * Converts a HEIC/HEIF photo (e.g. from an iPhone) to JPG or PNG, on-device.
 * The decoder (libheif compiled to WebAssembly) is large, so it is only loaded
 * when this function is first called.
 * @param {File} file
 * @param {{ to?: 'jpeg'|'png', quality?: number }} options
 * @returns {Promise<Blob>}
 */
export async function convertHeic(file, { to = 'jpeg', quality = 0.92 } = {}) {
  const mime = MIME[to]
  if (!mime) throw new Error(`Unsupported target format: ${to}`)

  const { heicTo, isHeic } = await import('heic-to')

  // Files renamed to .heic but actually JPG/PNG: the browser can decode those itself.
  let heic = false
  try {
    heic = await isHeic(file)
  } catch {
    heic = true
  }
  if (!heic) return convertImage(file, { to, quality })

  try {
    return await heicTo({ blob: file, type: mime, quality })
  } catch {
    throw new Error('Could not read this image. It may be corrupt or in an unsupported format.')
  }
}
