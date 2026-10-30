import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { createZip } from '../other/zipFiles'
import { validateFile, formatBytes, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

export default function ZipFilesTool() {
  const [items, setItems] = useState([]) // { file, id }
  const [zipName, setZipName] = useState('fileswift-archive')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFiles = (files) => {
    const accepted = []
    for (const f of files) {
      const check = validateFile(f, [], MAX_FILE_SIZE)
      if (check.valid) accepted.push({ file: f, id: `${f.name}-${f.size}-${Math.random()}` })
      else setError(check.error)
    }
    if (accepted.length) {
      setError(null)
      setResult(null)
      setItems((prev) => [...prev, ...accepted])
    }
  }

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id))

  const handleZip = async () => {
    if (items.length === 0) return
    setProcessing(true)
    setError(null)
    setProgress(0)
    try {
      const blob = await createZip(items.map((it) => it.file), { onProgress: setProgress })
      setResult({ blob, size: blob.size })
    } catch (err) {
      setError(err.message || friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const name = (zipName.trim() || 'fileswift-archive').replace(/\.zip$/i, '')
    downloadBlob(result.blob, `${name}.zip`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <UploadDropzone accept={[]} acceptLabel="any files" multiple maxSize={MAX_FILE_SIZE} onFiles={handleFiles} compact={items.length > 0} />
        {items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((it) => (
              <FilePreview key={it.id} name={it.file.name} size={it.file.size} onRemove={() => removeItem(it.id)} />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Create ZIP</h2>
        <p className="mt-2 text-sm text-ink-soft">Bundle any files into a single downloadable .zip archive — compressed entirely in your browser.</p>

        <label className="mt-4 block text-sm font-medium text-ink">
          Archive name
          <div className="mt-1.5 flex items-center overflow-hidden rounded-xl border border-line bg-mist">
            <input
              type="text"
              value={zipName}
              onChange={(e) => setZipName(e.target.value)}
              className="w-full bg-transparent p-2.5 text-sm text-ink outline-none"
              placeholder="fileswift-archive"
            />
            <span className="pr-3 text-sm text-ink-soft">.zip</span>
          </div>
        </label>

        <div className="mt-5 rounded-xl bg-mist p-3 text-sm">
          <p className="text-ink-soft">Files added</p>
          <p className="font-semibold text-ink">{items.length}</p>
        </div>

        {processing && (
          <div className="mt-4">
            <ProgressBar value={progress} label="Compressing…" />
          </div>
        )}

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Zipped {items.length} files ({formatBytes(result.size)}).</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleZip}
            disabled={processing || items.length === 0}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Zipping…' : 'Create ZIP'}
          </button>
          {result && <DownloadButton label="Download ZIP" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
