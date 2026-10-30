// Loaded from jsDelivr at runtime (in the user's browser) instead of being
// bundled as an npm dependency. The library's own WASM/ONNX runtime files
// are large (tens of MB) — bundling them causes production build tooling to
// choke on such a large binary asset. Loading over the network at runtime,
// exactly the way the library's own CDN-usage docs describe, sidesteps that
// entirely and still keeps the actual image processing on-device.
const CDN_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm'

let removeBackgroundPromise = null

/**
 * Lazily imports @imgly/background-removal. Only ever loaded on the
 * background-remover tool page.
 */
async function getRemoveBackground() {
  if (!removeBackgroundPromise) {
    removeBackgroundPromise = import(/* @vite-ignore */ CDN_URL).then((mod) => mod.default || mod)
  }
  return removeBackgroundPromise
}

/**
 * Removes the background from an image entirely on-device using a small
 * neural network (ONNX model) run via WebAssembly. The model itself is
 * fetched from IMG.LY's CDN on first use and cached by the browser — the
 * image never leaves the device.
 * @param {File|Blob} file
 * @param {{ onProgress?: (key:string, current:number, total:number) => void }} options
 * @returns {Promise<Blob>} a transparent PNG with the background removed
 */
export async function removeImageBackground(file, { onProgress } = {}) {
  const removeBackground = await getRemoveBackground()
  try {
    const blob = await removeBackground(file, {
      model: 'isnet_quint8', // smallest model download, good enough quality for most photos
      output: { format: 'image/png', quality: 0.9 },
      progress: onProgress,
    })
    return blob
  } catch {
    throw new Error(
      'Could not remove the background from this image. Please try a different photo, or check your connection (the AI model downloads on first use).'
    )
  }
}
