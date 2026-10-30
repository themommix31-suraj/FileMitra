import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { cropImage } from '../image/cropImage'
import { validateFile, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

export default function CropImageTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  // Crop rect stored as fractions (0-1) of the displayed image so it's resolution-independent.
  const [rect, setRect] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const resultUrlRef = useRef(null)
  const imgWrapRef = useRef(null)
  const dragState = useRef(null)

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
    const img = new Image()
    img.onload = () => setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = createObjectURL(f)

    setError(null)
    setResult(null)
    setRect({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
    revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v))

  const pointerToFraction = (e) => {
    const box = imgWrapRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clamp01((clientX - box.left) / box.width), y: clamp01((clientY - box.top) / box.height) }
  }

  const startDrag = (e) => {
    e.preventDefault()
    const start = pointerToFraction(e)
    dragState.current = { start }
    setRect({ x: start.x, y: start.y, w: 0, h: 0 })

    const onMove = (moveEvent) => {
      const cur = pointerToFraction(moveEvent)
      const x = Math.min(start.x, cur.x)
      const y = Math.min(start.y, cur.y)
      const w = Math.abs(cur.x - start.x)
      const h = Math.abs(cur.y - start.y)
      setRect({ x, y, w, h })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const handleCrop = async () => {
    if (!file || rect.w <= 0 || rect.h <= 0) {
      setError('Drag a rectangle on the image to choose a crop area first.')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const blob = await cropImage(file, {
        x: rect.x * naturalSize.width,
        y: rect.y * naturalSize.height,
        width: rect.w * naturalSize.width,
        height: rect.h * naturalSize.height,
      })
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

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-cropped' }))
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
        {!result && (
          <>
            <p className="mb-2 text-xs text-ink-soft">Drag on the image to select the area to keep.</p>
            <div
              ref={imgWrapRef}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
              className="relative select-none overflow-hidden rounded-2xl border border-line bg-mist"
              style={{ touchAction: 'none' }}
            >
              <img src={previewUrl} alt="Preview of the uploaded image" className="block max-h-[420px] w-full object-contain" draggable={false} />
              {rect.w > 0 && rect.h > 0 && (
                <div
                  className="absolute border-2"
                  style={{
                    left: `${rect.x * 100}%`,
                    top: `${rect.y * 100}%`,
                    width: `${rect.w * 100}%`,
                    height: `${rect.h * 100}%`,
                    borderColor: 'var(--color-brand-500)',
                    background: 'color-mix(in srgb, var(--color-brand-500) 15%, transparent)',
                  }}
                />
              )}
            </div>
          </>
        )}
        {result && (
          <div className="overflow-hidden rounded-2xl border border-line bg-mist">
            <img src={result.url} alt="Cropped result" className="max-h-[420px] w-full object-contain" />
          </div>
        )}
        <div className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Crop settings</h2>

        <div className="mt-4 rounded-xl bg-mist p-3 text-sm">
          <p className="text-ink-soft">Selected area</p>
          <p className="font-semibold text-ink">
            {naturalSize.width && rect.w > 0
              ? `${Math.round(rect.w * naturalSize.width)} × ${Math.round(rect.h * naturalSize.height)} px`
              : 'No area selected yet'}
          </p>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Your image was cropped.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {!result && (
            <button
              type="button"
              onClick={handleCrop}
              disabled={processing}
              className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              {processing ? 'Cropping…' : 'Crop Image'}
            </button>
          )}
          {result && <DownloadButton label="Download Cropped Image" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
