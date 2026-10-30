/**
 * pdf.js 5.x uses Map/WeakMap `getOrInsert` / `getOrInsertComputed`, a very recent
 * JavaScript feature. Browsers without it would fail with "… is not a function" and
 * every PDF tool would report a valid PDF as broken, so add them when missing.
 */
function polyfillMapUpsert() {
  for (const Ctor of [Map, WeakMap]) {
    const proto = Ctor.prototype
    if (!proto.getOrInsert) {
      Object.defineProperty(proto, 'getOrInsert', {
        configurable: true,
        writable: true,
        value(key, value) {
          if (!this.has(key)) this.set(key, value)
          return this.get(key)
        },
      })
    }
    if (!proto.getOrInsertComputed) {
      Object.defineProperty(proto, 'getOrInsertComputed', {
        configurable: true,
        writable: true,
        value(key, callback) {
          if (!this.has(key)) this.set(key, callback(key))
          return this.get(key)
        },
      })
    }
  }
}

let pdfjsPromise = null

/**
 * Lazily imports pdf.js and wires up its worker. Only ever loaded on
 * PDF-related tool pages, never bundled into the main app chunk.
 */
export async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      polyfillMapUpsert()
      const pdfjs = await import('pdfjs-dist')
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      return pdfjs
    })()
  }
  return pdfjsPromise
}
