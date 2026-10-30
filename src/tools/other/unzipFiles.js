/**
 * Reads a ZIP archive and lists its contents, entirely on-device.
 * @param {File} zipFile
 * @returns {Promise<{ path: string, dir: boolean, size: number, getBlob: () => Promise<Blob> }[]>}
 */
export async function readZipEntries(zipFile) {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(zipFile)

  const entries = []
  zip.forEach((relativePath, entry) => {
    if (entry.dir) return
    entries.push({
      path: relativePath,
      dir: false,
      size: entry._data ? entry._data.uncompressedSize : 0,
      getBlob: () => entry.async('blob'),
    })
  })
  entries.sort((a, b) => a.path.localeCompare(b.path))
  return entries
}

/**
 * Extracts every file in a ZIP archive as individual { name, blob } pairs,
 * ready to download or re-bundle.
 * @param {File} zipFile
 * @returns {Promise<{ name: string, blob: Blob }[]>}
 */
export async function extractAllFromZip(zipFile) {
  const entries = await readZipEntries(zipFile)
  const files = []
  for (const entry of entries) {
    const blob = await entry.getBlob()
    files.push({ name: entry.path, blob })
  }
  return files
}
