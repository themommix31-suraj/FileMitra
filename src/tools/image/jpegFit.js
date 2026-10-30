/**
 * Pads a JPEG with harmless comment segments so it reaches at least `minBytes`.
 * The picture is unchanged — decoders simply skip comments. (Used when a form
 * demands a MINIMUM file size, e.g. "between 20 KB and 50 KB".)
 */
export async function padJpeg(blob, minBytes) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  if (bytes.length >= minBytes || bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob

  // Insert after SOI (and after the JFIF APP0 segment if present, which must come first).
  let insertAt = 2
  if (bytes[2] === 0xff && bytes[3] === 0xe0) insertAt = 4 + ((bytes[4] << 8) | bytes[5])

  let remaining = minBytes - bytes.length
  const segments = []
  while (remaining > 0) {
    const payload = Math.min(65533, Math.max(0, remaining - 4))
    const seg = new Uint8Array(4 + payload)
    seg[0] = 0xff
    seg[1] = 0xfe // COM
    seg[2] = ((payload + 2) >> 8) & 0xff
    seg[3] = (payload + 2) & 0xff
    seg.fill(0x20, 4) // spaces
    segments.push(seg)
    remaining -= seg.length
  }
  return new Blob([bytes.slice(0, insertAt), ...segments, bytes.slice(insertAt)], { type: 'image/jpeg' })
}

const encode = (canvas, quality) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/jpeg', quality))

/**
 * Encodes a canvas as a JPEG whose size lies within [minBytes, maxBytes] (either may be omitted).
 * Finds the highest quality that fits under the maximum, then pads up to the minimum if needed.
 * @returns {Promise<{ blob: Blob, quality: number, padded: boolean, tooBig: boolean }>}
 */
export async function encodeJpegInRange(canvas, { minBytes = 0, maxBytes = Infinity } = {}) {
  let quality = 0.95
  let blob = await encode(canvas, quality)
  let tooBig = false

  if (blob.size > maxBytes) {
    const lowest = await encode(canvas, 0.02)
    if (lowest.size > maxBytes) {
      return { blob: lowest, quality: 0.02, padded: false, tooBig: true }
    }
    let lo = 0.02
    let hi = 0.95
    blob = lowest
    quality = 0.02
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2
      const candidate = await encode(canvas, mid)
      if (candidate.size <= maxBytes) {
        blob = candidate
        quality = mid
        lo = mid
      } else {
        hi = mid
      }
    }
  }

  let padded = false
  if (blob.size < minBytes) {
    const margin = Math.max(512, Math.round(minBytes * 0.03))
    blob = await padJpeg(blob, Math.min(maxBytes, minBytes + margin))
    padded = true
  }
  return { blob, quality, padded, tooBig }
}
