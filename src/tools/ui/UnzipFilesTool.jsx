import { useState } from 'react'
import { Download } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import StatusBanner from '../../components/StatusBanner'
import { readZipEntries } from '../other/unzipFiles'
import { validateFile, formatBytes, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

const ACCEPT = ['application/zip', 'application/x-zip-compressed']

export default function UnzipFilesTool() {
  const [file, setFile] = useState(null)
  const [entries, setEntries] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = async (files) => {
    const f = files[0]
    const ext = f?.name.toLowerCase().endsWith('.zip')
    const check = validateFile(f, ext ? [] : ACCEPT, MAX_FILE_SIZE)
    if (!ext && !check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setFile(f)
    setEntries(null)
    setProcessing(true)
    try {
      const list = await readZipEntries(f)
      if (list.length === 0) throw new Error('This ZIP archive appears to be empty.')
      setEntries(list)
    } catch (err) {
      setError(err.message || friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownloadOne = async (entry) => {
    const blob = await entry.getBlob()
    downloadBlob(blob, entry.path.split('/').pop() || entry.path)
  }

  const handleDownloadAll = async () => {
    if (!entries) return
    for (const entry of entries) {
      const blob = await entry.getBlob()
      downloadBlob(blob, entry.path.split('/').pop() || entry.path)
      // Small delay so browsers don't block a burst of simultaneous downloads.
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  const reset = () => {
    setFile(null)
    setEntries(null)
    setError(null)
  }

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="a .zip archive" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <FilePreview name={file.name} size={file.size} onRemove={reset} />

      {processing && (
        <div className="mt-4">
          <StatusBanner type="success">Reading archive…</StatusBanner>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <StatusBanner type="error">{error}</StatusBanner>
        </div>
      )}

      {entries && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Contents</h2>
              <p className="mt-1 text-sm text-ink-soft">{entries.length} files found — download individually or all at once.</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download All
            </button>
          </div>

          <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto">
            {entries.map((entry) => (
              <li key={entry.path} className="flex items-center gap-3 rounded-xl border border-line bg-mist p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{entry.path}</p>
                  <p className="text-xs text-ink-soft">{formatBytes(entry.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadOne(entry)}
                  aria-label={`Download ${entry.path}`}
                  className="rounded-full p-2 text-ink-soft transition-colors hover:bg-white hover:text-ink"
                  style={{ color: 'var(--color-brand-600)' }}
                >
                  <Download className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
