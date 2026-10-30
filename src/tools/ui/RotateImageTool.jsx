import { useEffect, useRef, useState } from 'react'
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { rotateImage } from '../image/rotateImage'
import { validateFile, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

export default function RotateImageTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [rotate, setRotate] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
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

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setResult(null)
    setRotate(0)
    setFlipH(false)
    setFlipV(false)
    revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const applyAndPreview = async (next) => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await rotateImage(file, next)
      revokeObjectURL(resultUrlRef.current)
      const url = createObjectURL(blob)
      resultUrlRef.current = url
      setResult({ blob, url })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const rotateBy = (delta) => {
    const next = (rotate + delta + 360) % 360
    setRotate(next)
    applyAndPreview({ rotate: next, flipH, flipV })
  }

  const toggleFlipH = () => {
    const next = !flipH
    setFlipH(next)
    applyAndPreview({ rotate, flipH: next, flipV })
  }

  const toggleFlipV = () => {
    const next = !flipV
    setFlipV(next)
    applyAndPreview({ rotate, flipH, flipV: next })
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-rotated' }))
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
        <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-mist p-4">
          <img src={result?.url || previewUrl} alt="Preview of the uploaded image" className="max-h-[420px] max-w-full object-contain" />
        </div>
        <div className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Rotate &amp; flip</h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => rotateBy(-90)} disabled={processing} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-mist px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white disabled:opacity-60">
            <RotateCcw className="h-4 w-4" /> Rotate left
          </button>
          <button type="button" onClick={() => rotateBy(90)} disabled={processing} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-mist px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white disabled:opacity-60">
            <RotateCw className="h-4 w-4" /> Rotate right
          </button>
          <button type="button" onClick={toggleFlipH} disabled={processing} aria-pressed={flipH} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${flipH ? 'border-[var(--color-brand-500)] bg-brand-50 text-ink' : 'border-line bg-mist text-ink hover:bg-white'}`}>
            <FlipHorizontal className="h-4 w-4" /> Flip horizontal
          </button>
          <button type="button" onClick={toggleFlipV} disabled={processing} aria-pressed={flipV} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${flipV ? 'border-[var(--color-brand-500)] bg-brand-50 text-ink' : 'border-line bg-mist text-ink hover:bg-white'}`}>
            <FlipVertical className="h-4 w-4" /> Flip vertical
          </button>
        </div>

        <div className="mt-5 rounded-xl bg-mist p-3 text-sm">
          <p className="text-ink-soft">Current rotation</p>
          <p className="font-semibold text-ink">{rotate}°{flipH ? ' \u00b7 flipped H' : ''}{flipV ? ' \u00b7 flipped V' : ''}</p>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Preview updated — download whenever you're happy with it.</StatusBanner>
          </div>
        )}

        <div className="mt-5">
          {result && <DownloadButton label="Download Image" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
