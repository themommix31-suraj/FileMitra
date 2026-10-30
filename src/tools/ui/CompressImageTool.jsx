import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { compressImage } from '../image/compressImage'
import { validateFile, formatBytes, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'
import { percentSaved } from '../../utils/formatUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const EXT_BY_FORMAT = { jpeg: '.jpg', png: '.png', webp: '.webp' }

export default function CompressImageTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [quality, setQuality] = useState(0.7)
  const [format, setFormat] = useState('jpeg')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null) // { blob, url, size }
  const [error, setError] = useState(null)
  const resultUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      revokeObjectURL(previewUrl)
      revokeObjectURL(resultUrlRef.current)
    }
  }, [previewUrl])

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setResult(null)
    revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
    setFormat(f.type === 'image/png' ? 'png' : 'jpeg')
  }

  const handleCompress = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await compressImage(file, { quality, format })
      revokeObjectURL(resultUrlRef.current)
      const url = createObjectURL(blob)
      resultUrlRef.current = url
      setResult({ blob, url, size: blob.size })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-compressed', newExt: EXT_BY_FORMAT[format] }))
  }

  const reset = () => {
    revokeObjectURL(previewUrl)
    revokeObjectURL(resultUrlRef.current)
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="an image (JPG, PNG or WebP)" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
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
        <div className="overflow-hidden rounded-2xl border border-line bg-mist">
          <img src={result?.url || previewUrl} alt="Preview of the uploaded image" className="max-h-[420px] w-full object-contain" />
        </div>
        <div className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Compression settings</h2>

        <div className="mt-4">
          <label htmlFor="quality" className="flex justify-between text-sm font-medium text-ink">
            <span>Quality</span>
            <span className="text-ink-soft">{Math.round(quality * 100)}%</span>
          </label>
          <input
            id="quality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            disabled={format === 'png'}
            className="mt-2 w-full accent-[var(--color-brand-500)] disabled:opacity-40"
          />
          {format === 'png' && <p className="mt-1 text-xs text-ink-soft">PNG is lossless — quality doesn't apply.</p>}
        </div>

        <div className="mt-5">
          <label htmlFor="format" className="text-sm font-medium text-ink">Output format</label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
          >
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-mist p-3 text-sm">
          <div>
            <p className="text-ink-soft">Original size</p>
            <p className="font-semibold text-ink">{formatBytes(file.size)}</p>
          </div>
          <div>
            <p className="text-ink-soft">{result ? 'Compressed size' : 'Estimated size'}</p>
            <p className="font-semibold text-ink">{result ? formatBytes(result.size) : '—'}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">
              Done! Your image was compressed by {percentSaved(file.size, result.size)}%.
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
            {processing ? 'Compressing…' : 'Compress Image'}
          </button>
          {result && <DownloadButton label="Download Compressed Image" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
