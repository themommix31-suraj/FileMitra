import { loadImage, createObjectURL, revokeObjectURL } from '../../utils/fileUtils'

export function isSvgFile(file) {
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '')
}

function parseLength(value) {
  if (!value || /%$/.test(value.trim())) return null
  const n = parseFloat(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Loads an SVG file as an <img>, making sure it has explicit pixel dimensions
 * (SVGs with only a viewBox report a width of 0 in some browsers, which breaks
 * canvas drawing).
 * @param {File} file
 * @returns {Promise<{ img: HTMLImageElement, url: string, width: number, height: number }>}
 */
export async function loadSvgImage(file) {
  const text = await file.text()
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const svg = doc.documentElement
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) {
    throw new Error('Could not read this image. It may be corrupt or in an unsupported format.')
  }

  let width = parseLength(svg.getAttribute('width'))
  let height = parseLength(svg.getAttribute('height'))
  const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number)
  const hasViewBox = viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0

  if (hasViewBox) {
    const ratio = viewBox[2] / viewBox[3]
    if (!width && !height) {
      width = viewBox[2]
      height = viewBox[3]
    } else if (!width) {
      width = height * ratio
    } else if (!height) {
      height = width / ratio
    }
  }
  width = width || 300
  height = height || 150

  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })
  const url = createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not read this image. It may be corrupt or in an unsupported format.'))
      el.src = url
    })
    return { img, url, width, height }
  } catch (err) {
    revokeObjectURL(url)
    throw err
  }
}

/** Loads any supported image (including SVG) and reports its pixel size. */
export async function loadAnyImage(file) {
  if (isSvgFile(file)) return loadSvgImage(file)
  const { img, url } = await loadImage(file)
  return { img, url, width: img.naturalWidth, height: img.naturalHeight }
}
