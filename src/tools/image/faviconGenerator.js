import { revokeObjectURL } from '../../utils/fileUtils'
import { loadAnyImage } from './svgUtils'

export const ICO_SIZES = [16, 32, 48]

export const PNG_OUTPUTS = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

function canvasToPng(canvas) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the icon.'))), 'image/png')
  )
}

/** Draws the source into a square canvas ('crop' fills it, 'fit' keeps the whole image). */
function renderSquare(source, srcW, srcH, size, { mode, background }) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, size, size)
  }
  const ratio = mode === 'crop' ? Math.max(size / srcW, size / srcH) : Math.min(size / srcW, size / srcH)
  const w = srcW * ratio
  const h = srcH * ratio
  ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h)
  return canvas
}

/** Packs PNG images into a single .ico (PNG-compressed entries, supported by all modern browsers). */
async function buildIco(entries) {
  const headerSize = 6 + 16 * entries.length
  const total = entries.reduce((sum, e) => sum + e.bytes.length, headerSize)
  const buf = new ArrayBuffer(total)
  const view = new DataView(buf)
  const out = new Uint8Array(buf)
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: icon
  view.setUint16(4, entries.length, true)
  let offset = headerSize
  entries.forEach((e, i) => {
    const o = 6 + 16 * i
    view.setUint8(o, e.size >= 256 ? 0 : e.size)
    view.setUint8(o + 1, e.size >= 256 ? 0 : e.size)
    view.setUint16(o + 4, 1, true) // colour planes
    view.setUint16(o + 6, 32, true) // bits per pixel
    view.setUint32(o + 8, e.bytes.length, true)
    view.setUint32(o + 12, offset, true)
    out.set(e.bytes, offset)
    offset += e.bytes.length
  })
  return new Blob([buf], { type: 'image/x-icon' })
}

/**
 * Builds a full favicon set from one image.
 * @param {File} file PNG, JPG, WebP or SVG
 * @param {{ mode?: 'fit'|'crop', background?: string|null }} options
 * @returns {Promise<{ ico: Blob, pngs: { name: string, size: number, blob: Blob }[] }>}
 */
export async function generateFavicons(file, { mode = 'fit', background = null } = {}) {
  const { img, url, width, height } = await loadAnyImage(file)
  try {
    const opts = { mode, background }
    const pngs = []
    for (const { name, size } of PNG_OUTPUTS) {
      pngs.push({ name, size, blob: await canvasToPng(renderSquare(img, width, height, size, opts)) })
    }
    const icoEntries = []
    for (const size of ICO_SIZES) {
      const blob = await canvasToPng(renderSquare(img, width, height, size, opts))
      icoEntries.push({ size, bytes: new Uint8Array(await blob.arrayBuffer()) })
    }
    return { ico: await buildIco(icoEntries), pngs }
  } finally {
    revokeObjectURL(url)
  }
}

export const FAVICON_HTML = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`

export const WEB_MANIFEST = JSON.stringify(
  {
    name: '',
    short_name: '',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  },
  null,
  2
)
