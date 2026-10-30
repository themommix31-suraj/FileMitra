import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { resizeImage, getImageDimensions } from '../image/resizeImage'
import { validateFile, formatBytes, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const EXT_BY_FORMAT = { jpeg: '.jpg', png: '.png', webp: '.webp' }

export default function ResizeImageTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [original, setOriginal] = useState(null) // { width, height }
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockRatio, setLockRatio] = useState(true)
  const [format, setFormat] = useState('jpeg')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const resultUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      revokeObjectURL(previewUrl)
      revokeObjectURL(resultUrlRef.current)
    }
  }, [previewUrl])

  const handleFiles = async (files) => {
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
    try {
      const dims = await getImageDimensions(f)
      setOriginal(dims)
      setWidth(dims.width)
      setHeight(dims.height)
    } catch (err) {
      setError(friendlyErrorMessage(err))
    }
  }

  const onWidthChange = (val) => {
    const w = Number(val)
    setWidth(val)
    if (lockRatio && original && w > 0) {
      setHeight(Math.round((w / original.width) * original.height))
    }
  }

  const onHeightChange = (val) => {
    const h = Number(val)
    setHeight(val)
    if (lockRatio && original && h > 0) {
      setWidth(Math.round((h / original.height) * original.width))
    }
  }

  const handleResize = async () => {
    if (!file || !width || !height) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await resizeImage(file, { width: Number(width), height: Number(height), format, quality: 0.9 })
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
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: `-${width}x${height}`, newExt: EXT_BY_FORMAT[format] }))
  }

  const reset = () => {
    revokeObjectURL(previewUrl)
    revokeObjectURL(resultUrlRef.current)
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setOriginal(null)
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
          <FilePreview
            name={file.name}
            size={file.size}
            previewUrl={previewUrl}
            onRemove={reset}
            extraInfo={original ? `${original.width} × ${original.height}px` : undefined}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Resize settings</h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="width" className="text-sm font-medium text-ink">Width (px)</label>
            <input
              id="width"
              type="number"
              min="1"
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="height" className="text-sm font-medium text-ink">Height (px)</label>
            <input
              id="height"
              type="number"
              min="1"
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
            />
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={lockRatio}
            onChange={(e) => setLockRatio(e.target.checked)}
            className="h-4 w-4 rounded accent-[var(--color-brand-500)]"
          />
          Maintain aspect ratio
        </label>

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
            <p className="text-ink-soft">{result ? 'Resized size' : 'Estimated size'}</p>
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
            <StatusBanner type="success">Done! Your image is now {width} × {height}px.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleResize}
            disabled={processing || !width || !height}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Resizing…' : 'Resize Image'}
          </button>
          {result && <DownloadButton label="Download Resized Image" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
