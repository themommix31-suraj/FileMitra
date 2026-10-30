import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { convertImage } from '../image/convertImage'
import { validateFile, formatBytes, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const EXT_BY_FORMAT = { jpeg: '.jpg', png: '.png', webp: '.webp' }
const LABEL_BY_FORMAT = { jpeg: 'JPG', png: 'PNG', webp: 'WebP' }

/**
 * @param {{ fromMime: string, toFormat: 'jpeg'|'png'|'webp' }} props
 */
export default function ImageConverterTool({ fromMime, toFormat }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [quality, setQuality] = useState(80) // 0-100, used for WebP output
  const resultUrlRef = useRef(null)

  const showQuality = toFormat === 'webp'
  const fromLabel = LABEL_BY_FORMAT[fromMime === 'image/jpeg' ? 'jpeg' : fromMime === 'image/png' ? 'png' : 'webp']
  const toLabel = LABEL_BY_FORMAT[toFormat]

  useEffect(() => {
    return () => {
      revokeObjectURL(previewUrl)
      revokeObjectURL(resultUrlRef.current)
    }
  }, [previewUrl])

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, [fromMime], MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setResult(null)
    revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const handleConvert = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await convertImage(file, { to: toFormat, quality: quality / 100 })
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
    downloadBlob(result.blob, suggestOutputName(file.name, { newExt: EXT_BY_FORMAT[toFormat] }))
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
        <UploadDropzone accept={[fromMime]} acceptLabel={`a ${fromLabel} image`} maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        <p className="mt-4 text-center text-sm text-ink-soft">
          Need a different format?{' '}
          <Link to="/tools/image-converter" className="font-semibold underline" style={{ color: 'var(--color-brand-600)' }}>
            Use the all-in-one Image Converter
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl border border-line bg-mist">
          <img src={previewUrl} alt="Preview of the uploaded image" className="max-h-[420px] w-full object-contain" />
        </div>
        <div className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Convert {fromLabel} to {toLabel}</h2>

        <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-mist p-4 text-sm font-semibold text-ink">
          <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm">{fromLabel}</span>
          <span className="text-ink-soft">→</span>
          <span className="rounded-lg px-3 py-1.5 text-white shadow-sm" style={{ background: 'var(--color-brand-500)' }}>{toLabel}</span>
        </div>

        {showQuality && (
          <div className="mt-5">
            <label htmlFor="webp-quality" className="flex justify-between text-sm font-medium text-ink">
              <span>Quality</span>
              <span className="text-ink-soft">{quality}</span>
            </label>
            <input
              id="webp-quality"
              type="range"
              min="0"
              max="100"
              step="1"
              value={quality}
              onChange={(e) => {
                setQuality(Number(e.target.value))
                setResult(null)
              }}
              className="mt-2 w-full accent-[var(--color-brand-500)]"
            />
            <div className="flex justify-between text-xs text-ink-soft">
              <span>0 (smallest file)</span>
              <span>100 (best quality)</span>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-mist p-3 text-sm">
          <div>
            <p className="text-ink-soft">Original size</p>
            <p className="font-semibold text-ink">{formatBytes(file.size)}</p>
          </div>
          <div>
            <p className="text-ink-soft">Output size</p>
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
            <StatusBanner type="success">Done! Your {fromLabel} was converted to {toLabel}.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleConvert}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Converting…' : `Convert to ${toLabel}`}
          </button>
          {result && <DownloadButton label={`Download ${toLabel}`} onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
