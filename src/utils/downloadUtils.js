export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadAsZip(files, zipName = 'fileswift-files.zip') {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  files.forEach(({ name, blob }) => zip.file(name, blob))
  const content = await zip.generateAsync({ type: 'blob' })
  downloadBlob(content, zipName)
}

export function suggestOutputName(originalName, { suffix = '', newExt } = {}) {
  const dot = originalName.lastIndexOf('.')
  const base = dot >= 0 ? originalName.slice(0, dot) : originalName
  const ext = newExt || (dot >= 0 ? originalName.slice(dot) : '')
  return `${base}${suffix}${ext}`
}

/** Makes file names unique inside one ZIP: a.jpg, a.jpg -> a.jpg, a-2.jpg */
export function dedupeNames(names) {
  const seen = new Map()
  return names.map((name) => {
    const count = (seen.get(name) || 0) + 1
    seen.set(name, count)
    if (count === 1) return name
    const dot = name.lastIndexOf('.')
    return dot > 0 ? `${name.slice(0, dot)}-${count}${name.slice(dot)}` : `${name}-${count}`
  })
}
