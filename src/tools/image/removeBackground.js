import { loadImage, revokeObjectURL } from '../../utils/fileUtils'

/**
 * On-device background removal.
 *
 * Runs a U²-Net family segmentation model (Apache-2.0) with onnxruntime-web
 * (MIT) entirely in the browser — nothing is uploaded. The model files are
 * served from /models (downloaded by `npm run models`, see scripts/fetch-models.mjs).
 */

// To switch the larger model off (e.g. for licence reasons), delete its entry here.
export const BG_MODELS = {
  quality: { id: 'quality', file: 'silueta.onnx', label: 'Best quality', sizeMB: 44, hint: 'Cleaner edges, arms and hair' },
  fast: { id: 'fast', file: 'u2netp.onnx', label: 'Fast & light', sizeMB: 4.5, hint: 'Small download, good for simple photos' },
}

const INPUT_SIZE = 320
const MAX_OUTPUT_EDGE = 4096
const CACHE_NAME = 'fileswift-models-v1'

let ortPromise = null
const sessionCache = new Map()

async function getOrt() {
  if (!ortPromise) {
    ortPromise = (async () => {
      const [ort, wasm, mjs] = await Promise.all([
        import('onnxruntime-web/wasm'),
        import('onnxruntime-web/ort-wasm-simd-threaded.wasm?url'),
        import('onnxruntime-web/ort-wasm-simd-threaded.mjs?url'),
      ])
      ort.env.wasm.wasmPaths = { mjs: mjs.default, wasm: wasm.default }
      ort.env.wasm.numThreads = 1 // multi-threading needs special server headers; 1 thread is plenty for a 320px model
      return ort
    })()
  }
  return ortPromise
}

/** Downloads a model with progress (cached afterwards via the Cache API). */
async function fetchModelBytes(file, onProgress) {
  const url = `${import.meta.env.BASE_URL}models/${file}`
  let cache = null
  try {
    cache = await caches.open(CACHE_NAME)
    const hit = await cache.match(url)
    if (hit) return new Uint8Array(await hit.arrayBuffer())
  } catch {
    cache = null // Cache API unavailable (e.g. private mode) — just fetch every time
  }

  const res = await fetch(url)
  const type = res.headers.get('content-type') || ''
  if (!res.ok || type.includes('text/html')) {
    // Visitors get a plain message; the fix for the site owner goes to the console.
    console.error(`[background removal] Model file /models/${file} was not found. Run "npm run models" and redeploy.`)
    const err = new Error('The AI model couldn’t be loaded right now. Please try again in a little while.')
    err.code = 'MODEL_MISSING'
    throw err
  }
  const total = Number(res.headers.get('content-length')) || 0
  const reader = res.body.getReader()
  const chunks = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total) onProgress?.({ stage: 'download', percent: Math.min(100, (received / total) * 100) })
  }
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const c of chunks) {
    bytes.set(c, offset)
    offset += c.length
  }
  try {
    await cache?.put(url, new Response(bytes, { headers: { 'content-type': 'application/octet-stream' } }))
  } catch {
    /* storage full or blocked — the model still works, it just isn't cached */
  }
  return bytes
}

async function getSession(modelId, onProgress) {
  const model = BG_MODELS[modelId] || BG_MODELS.fast
  if (!sessionCache.has(model.id)) {
    sessionCache.set(
      model.id,
      (async () => {
        const ort = await getOrt()
        const bytes = await fetchModelBytes(model.file, onProgress)
        onProgress?.({ stage: 'prepare', percent: 100 })
        return { ort, session: await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] }) }
      })().catch((err) => {
        sessionCache.delete(model.id) // allow a retry after a failure
        throw err
      })
    )
  }
  return sessionCache.get(model.id)
}

/** Resizes to the model's input and converts to a normalised CHW float tensor (same as rembg). */
function toTensorData(source) {
  const canvas = document.createElement('canvas')
  canvas.width = INPUT_SIZE
  canvas.height = INPUT_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(source, 0, 0, INPUT_SIZE, INPUT_SIZE)
  const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE)
  const n = INPUT_SIZE * INPUT_SIZE
  let max = 1
  for (let i = 0; i < data.length; i += 4) max = Math.max(max, data[i], data[i + 1], data[i + 2])
  const mean = [0.485, 0.456, 0.406]
  const std = [0.229, 0.224, 0.225]
  const out = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) out[c * n + i] = (data[i * 4 + c] / max - mean[c]) / std[c]
  }
  return out
}

/**
 * Cuts out the subject.
 * @param {Blob|HTMLImageElement|HTMLCanvasElement} input
 * @param {{ model?: 'quality'|'fast', onProgress?: (p:{stage:string, percent:number}) => void }} options
 * @returns {Promise<HTMLCanvasElement>} an RGBA canvas (transparent background) at the image's full size (max 4096px)
 */
export async function getCutoutCanvas(input, { model = 'quality', onProgress } = {}) {
  let img = input
  let url = null
  if (input instanceof Blob) {
    const loaded = await loadImage(input)
    img = loaded.img
    url = loaded.url
  }
  try {
    const srcW = img.naturalWidth || img.width
    const srcH = img.naturalHeight || img.height
    const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(srcW, srcH))
    const W = Math.max(1, Math.round(srcW * scale))
    const H = Math.max(1, Math.round(srcH * scale))

    const { ort, session } = await getSession(model, onProgress)
    onProgress?.({ stage: 'run', percent: 0 })

    const tensor = new ort.Tensor('float32', toTensorData(img), [1, 3, INPUT_SIZE, INPUT_SIZE])
    const results = await session.run({ [session.inputNames[0]]: tensor })
    const raw = results[session.outputNames[0]].data

    // Normalise the mask to 0..1
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] < lo) lo = raw[i]
      if (raw[i] > hi) hi = raw[i]
    }
    const range = hi - lo || 1

    // Mask -> small canvas -> smooth upscale to full size
    const maskSmall = document.createElement('canvas')
    maskSmall.width = INPUT_SIZE
    maskSmall.height = INPUT_SIZE
    const mctx = maskSmall.getContext('2d')
    const maskImage = mctx.createImageData(INPUT_SIZE, INPUT_SIZE)
    for (let i = 0; i < raw.length; i++) {
      const v = Math.round(((raw[i] - lo) / range) * 255)
      maskImage.data[i * 4] = v
      maskImage.data[i * 4 + 3] = 255
    }
    mctx.putImageData(maskImage, 0, 0)

    const maskBig = document.createElement('canvas')
    maskBig.width = W
    maskBig.height = H
    const bctx = maskBig.getContext('2d', { willReadFrequently: true })
    bctx.imageSmoothingQuality = 'high'
    bctx.drawImage(maskSmall, 0, 0, W, H)
    const maskPixels = bctx.getImageData(0, 0, W, H).data

    const out = document.createElement('canvas')
    out.width = W
    out.height = H
    const octx = out.getContext('2d', { willReadFrequently: true })
    octx.drawImage(img, 0, 0, W, H)
    const pixels = octx.getImageData(0, 0, W, H)
    // Slight contrast curve: removes faint "ghost" areas and firms up the subject edge.
    const LOW = 0.1
    const HIGH = 0.9
    for (let i = 0; i < pixels.data.length; i += 4) {
      const m = maskPixels[i] / 255
      const a = Math.min(1, Math.max(0, (m - LOW) / (HIGH - LOW)))
      pixels.data[i + 3] = Math.round(a * 255)
    }
    octx.putImageData(pixels, 0, 0)
    onProgress?.({ stage: 'run', percent: 100 })
    return out
  } finally {
    revokeObjectURL(url)
  }
}

/** Fills the transparent areas of a cut-out canvas with a solid colour. */
export function compositeOnColor(cutout, color = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = cutout.width
  canvas.height = cutout.height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(cutout, 0, 0)
  return canvas
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), type, quality)
  )
}

/** Transparent PNG with the background removed (kept for backwards compatibility). */
export async function removeImageBackground(file, { model = 'quality', onProgress } = {}) {
  const canvas = await getCutoutCanvas(file, { model, onProgress })
  return canvasToBlob(canvas, 'image/png')
}
