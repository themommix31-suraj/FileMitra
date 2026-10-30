/**
 * Bundles multiple files into a single ZIP archive, entirely on-device.
 * @param {File[]} files
 * @param {{ onProgress?: (percent:number) => void }} options
 * @returns {Promise<Blob>}
 */
export async function createZip(files, { onProgress } = {}) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  files.forEach((file) => zip.file(file.name, file))
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }, (meta) => {
    onProgress?.(meta.percent)
  })
}
