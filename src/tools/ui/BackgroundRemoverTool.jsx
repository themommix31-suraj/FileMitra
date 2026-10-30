import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { SegmentedControl } from '../../components/calcParts'
import { getCutoutCanvas, compositeOnColor, canvasToBlob, BG_MODELS } from '../image/removeBackground'
import { validateFile, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const CHECKER = {
  backgroundImage: 'conic-gradient(#e9ebf5 25%, #fff 0 50%, #e9ebf5 0 75%, #fff 0)',
  backgroundSize: '20px 20px',
}
const SWATCHES = [
  { value: 'transparent', label: 'Transparent' },
  { value: '#ffffff', label: 'White' },
  { value: '#d9e8fb', label: 'Light blue' },
  { value: '#f2f2f2', label: 'Light grey' },
  { value: 'custom', label: 'Colour…' },
]

export default function BackgroundRemoverTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [model, setModel] = useState('quality')
  const [bg, setBg] = useState('transparent')
  const [customColor, setCustomColor] = useState('#ff6b6b')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, label: '' })
  const [cutout, setCutout] = useState(null) // canvas
  const [resultUrl, setResultUrl] = useState(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [error, setError] = useState(null)
  const urlRef = useRef(null)

  const fillColor = bg === 'custom' ? customColor : bg

  // Rebuild the preview whenever the cut-out or the chosen background changes.
  useEffect(() => {
    if (!cutout) return undefined
    let cancelled = false
    const canvas = fillColor === 'transparent' ? cutout : compositeOnColor(cutout, fillColor)
    canvasToBlob(canvas, 'image/png').then((blob) => {
      if (cancelled) return
      revokeObjectURL(urlRef.current)
      urlRef.current = createObjectURL(blob)
      setResultUrl(urlRef.current)
    })
    return () => {
      cancelled = true
    }
  }, [cutout, fillColor])

  useEffect(() => () => {
    revokeObjectURL(previewUrl)
    revokeObjectURL(urlRef.current)
  }, [previewUrl])

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setCutout(null)
    setResultUrl(null)
    setShowOriginal(false)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setCutout(null)
    setResultUrl(null)
    setError(null)
  }

  const run = async () => {
    setProcessing(true)
    setError(null)
    setProgress({ percent: 0, label: 'Starting…' })
    try {
      const canvas = await getCutoutCanvas(file, {
        model,
        onProgress: ({ stage, percent }) => {
          const label =
            stage === 'download' ? `Downloading the AI model (${BG_MODELS[model].sizeMB} MB, first time only)…` : stage === 'prepare' ? 'Starting the AI model…' : 'Cutting out the subject…'
          setProgress({ percent: stage === 'run' ? 100 : percent, label })
        },
      })
      setCutout(canvas)
      setShowOriginal(false)
    } catch (err) {
      setError(err?.code === 'MODEL_MISSING' ? err.message : friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const download = async () => {
    const transparent = fillColor === 'transparent'
    const canvas = transparent ? cutout : compositeOnColor(cutout, fillColor)
    const blob = await canvasToBlob(canvas, transparent ? 'image/png' : 'image/jpeg', 0.95)
    downloadBlob(blob, suggestOutputName(file.name, { suffix: '-no-bg', newExt: transparent ? '.png' : '.jpg' }))
  }

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="a photo (JPG, PNG or WebP)" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  const shown = cutout && !showOriginal ? resultUrl || previewUrl : previewUrl

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl border border-line" style={cutout && !showOriginal && fillColor === 'transparent' ? CHECKER : { background: '#f4f4f5' }}>
          <img src={shown} alt={cutout && !showOriginal ? 'Photo with the background removed' : 'Your original photo'} className="mx-auto max-h-[460px] w-full object-contain" />
        </div>
        {cutout && (
          <div className="mt-3">
            <SegmentedControl
              options={[
                { value: false, label: 'Result' },
                { value: true, label: 'Original' },
              ]}
              value={showOriginal}
              onChange={setShowOriginal}
            />
          </div>
        )}
        <ul className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </ul>
      </div>

      <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Remove background</h2>
          <p className="mt-1 text-sm text-ink-soft">An AI model runs on your device, so your photo is never uploaded. Full resolution, no watermark, no limits.</p>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Quality</p>
          <div role="radiogroup" aria-label="Quality" className="grid gap-2">
            {Object.values(BG_MODELS).map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition-colors ${model === m.id ? 'border-[var(--color-brand-500)] bg-brand-50' : 'border-line'}`}
              >
                <span>
                  <span className="block font-medium text-ink">
                    {m.label} <span className="font-normal text-ink-soft">· {m.sizeMB} MB download</span>
                  </span>
                  <span className="block text-xs text-ink-soft">{m.hint}</span>
                </span>
                <input
                  type="radio"
                  name="bg-model"
                  checked={model === m.id}
                  disabled={processing}
                  onChange={() => {
                    setModel(m.id)
                    setCutout(null)
                    setResultUrl(null)
                  }}
                  className="accent-[var(--color-brand-500)]"
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">The model downloads once and is remembered by your browser.</p>
        </div>

        {processing && <ProgressBar value={progress.percent} label={progress.label} />}
        {error && <StatusBanner type="error">{error}</StatusBanner>}

        <button
          type="button"
          onClick={run}
          disabled={processing}
          className="inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
        >
          {processing ? 'Removing…' : cutout ? 'Run again' : 'Remove background'}
        </button>

        {cutout && (
          <div className="space-y-4 border-t border-line pt-5">
            <StatusBanner type="success">Done! Pick a background and download.</StatusBanner>
            <SegmentedControl label="Background" options={SWATCHES} value={bg} onChange={setBg} />
            {bg === 'custom' && (
              <div className="flex items-center gap-3">
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} aria-label="Background colour" className="h-10 w-14 cursor-pointer rounded-lg border border-line" />
                <span className="font-mono text-sm text-ink-soft">{customColor}</span>
              </div>
            )}
            <DownloadButton label={fillColor === 'transparent' ? 'Download transparent PNG' : 'Download JPG'} onClick={download} />
          </div>
        )}
      </div>
    </div>
  )
}
