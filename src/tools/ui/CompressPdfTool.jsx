import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { compressPdf } from '../pdf/compressPdf'
import { validateFile, formatBytes, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'
import { percentSaved } from '../../utils/formatUtils'

const ACCEPT = ['application/pdf']
const LEVELS = [
  { value: 'low', label: 'Low', hint: 'Best quality, smaller savings' },
  { value: 'medium', label: 'Medium', hint: 'Balanced — recommended' },
  { value: 'high', label: 'High', hint: 'Smallest file, lower quality' },
]

export default function CompressPdfTool() {
  const [file, setFile] = useState(null)
  const [level, setLevel] = useState('medium')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setResult(null)
    setFile(f)
  }

  const handleCompress = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setProgress(0)
    try {
      const { blob, improved } = await compressPdf(file, {
        level,
        onProgress: (done, total) => setProgress((done / total) * 100),
      })
      setResult({ blob, size: blob.size, improved })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-compressed' }))
  }

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="a PDF file" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setResult(null) }} />
        <p className="mt-3 text-xs text-ink-soft">
          Note: compression re-renders each page as an image to shrink the file, so text in the output PDF
          is no longer selectable. This works best for scanned documents and image-heavy PDFs.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Compression level</h2>

        <div className="mt-4 space-y-2">
          {LEVELS.map((l) => (
            <label
              key={l.value}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition-colors ${
                level === l.value ? 'border-[var(--color-brand-500)] bg-brand-50' : 'border-line'
              }`}
            >
              <span>
                <span className="block font-medium text-ink">{l.label}</span>
                <span className="block text-xs text-ink-soft">{l.hint}</span>
              </span>
              <input type="radio" name="level" value={l.value} checked={level === l.value} onChange={() => setLevel(l.value)} className="accent-[var(--color-brand-500)]" />
            </label>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-mist p-3 text-sm">
          <div>
            <p className="text-ink-soft">Original size</p>
            <p className="font-semibold text-ink">{formatBytes(file.size)}</p>
          </div>
          <div>
            <p className="text-ink-soft">Compressed size</p>
            <p className="font-semibold text-ink">{result ? formatBytes(result.size) : '—'}</p>
          </div>
        </div>

        {processing && (
          <div className="mt-4">
            <ProgressBar value={progress} label="Compressing pages…" />
          </div>
        )}

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type={result.improved ? 'success' : 'error'}>
              {result.improved
                ? `Done! Your PDF was compressed by ${percentSaved(file.size, result.size)}%.`
                : "This PDF is already well-optimized — compressing it further didn't reduce the size, so we kept the original."}
            </StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCompress}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Compressing…' : 'Compress PDF'}
          </button>
          {result && <DownloadButton label="Download Compressed PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
