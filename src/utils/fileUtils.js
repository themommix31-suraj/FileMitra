export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB recommended cap for in-browser processing

const EXT_BY_MIME = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/avif': ['.avif'],
  'image/svg+xml': ['.svg'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif', '.heic'],
  'application/pdf': ['.pdf'],
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

export function getExtension(filename = '') {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

/**
 * Validates a file against accepted MIME types, checking both the reported
 * MIME type AND the file extension, since browsers can report empty/incorrect
 * types for some sources (e.g. drag-and-drop from certain apps).
 */
export function validateFile(file, acceptedMimeTypes = [], maxSize = MAX_FILE_SIZE) {
  if (!file) return { valid: false, error: 'No file was provided.' }

  if (file.size === 0) {
    return { valid: false, error: 'This file appears to be empty or corrupt.' }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `This file is too large (${formatBytes(file.size)}). Please use a file under ${formatBytes(maxSize)}.`,
    }
  }

  if (acceptedMimeTypes.length > 0) {
    const ext = getExtension(file.name)
    const mimeOk = acceptedMimeTypes.includes(file.type)
    const extOk = acceptedMimeTypes.some((mime) => (EXT_BY_MIME[mime] || []).includes(ext))

    if (!mimeOk && !extOk) {
      return {
        valid: false,
        error: 'This file type is not supported by this tool. Please choose a different file.',
      }
    }
  }

  return { valid: true }
}

export function createObjectURL(fileOrBlob) {
  return URL.createObjectURL(fileOrBlob)
}

export function revokeObjectURL(url) {
  if (url) URL.revokeObjectURL(url)
}

export function readFileAsArrayBuffer(file) {
  return file.arrayBuffer()
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      revokeObjectURL(url)
      reject(new Error('Could not read this image. It may be corrupt or in an unsupported format.'))
    }
    img.src = url
  })
}

export function friendlyErrorMessage(err) {
  if (err && err.message && /corrupt|unsupported|read this/i.test(err.message)) {
    return err.message
  }
  return 'Something went wrong while processing this file. Please try another file or reduce the file size.'
}
