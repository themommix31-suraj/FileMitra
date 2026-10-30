/**
 * Converts a File into a Base64 data URL (and the raw base64 string),
 * entirely in the browser via FileReader.
 * @param {File} file
 * @returns {Promise<{ dataUrl: string, base64: string }>}
 */
export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = String(dataUrl).split(',')[1] || ''
      resolve({ dataUrl, base64 })
    }
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Converts a Base64 string (raw or a full data: URL) back into a Blob.
 * @param {string} input
 * @returns {{ blob: Blob, mime: string }}
 */
export function base64ToImage(input) {
  const trimmed = (input || '').trim()
  if (!trimmed) throw new Error('Paste a Base64 string first.')

  let mime = 'image/png'
  let raw = trimmed
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.*)$/s)
  if (dataUrlMatch) {
    mime = dataUrlMatch[1]
    raw = dataUrlMatch[2]
  }

  raw = raw.replace(/\s/g, '')

  let binary
  try {
    binary = atob(raw)
  } catch {
    throw new Error('This doesn\u2019t look like valid Base64. Check for missing characters or extra text.')
  }

  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  if (!/^image\//.test(mime)) mime = 'image/png'
  return { blob: new Blob([bytes], { type: mime }), mime }
}
