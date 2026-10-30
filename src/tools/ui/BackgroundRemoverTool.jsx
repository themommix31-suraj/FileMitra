import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { removeImageBackground } from '../image/removeBackground'
import { validateFile, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const CHECKERBOARD_BG = {
  backgroundImage:
    'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
}

export default function BackgroundRemoverTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
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
    revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const handleRemove = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setProgress(0)
    setProgressLabel('Starting…')
    try {
      const blob = await removeImageBackground(file, {
        onProgress: (key, current, total) => {
          setProgressLabel(key.includes('fetch') ? 'Downloading AI model…' : 'Processing image…')
          setProgress(total ? (current / total) * 100 : 0)
        },
      })
      revokeObjectURL(resultUrlRef.current)
      const url = createObjectURL(blob)
      resultUrlRef.current = url
      setResult({ blob, url })
    } catch (err) {
      setError(err.message || friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-no-bg', newExt: '.png' }))
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
        <div className="overflow-hidden rounded-2xl border border-line" style={result ? CHECKERBOARD_BG : { background: '#f4f4f5' }}>
          <img
            src={result ? result.url : previewUrl}
            alt={result ? 'Image with background removed' : 'Preview of the uploaded image'}
            className="max-h-[420px] w-full object-contain"
          />
        </div>
        <div className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Remove background</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Uses a small on-device AI model to cut out the subject and make the background transparent. The model
          downloads once (a few MB) and is cached by your browser for next time — your photo is never uploaded.
        </p>

        {processing && (
          <div className="mt-4">
            <ProgressBar value={progress} label={progressLabel} />
          </div>
        )}

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Background removed — download as a transparent PNG.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRemove}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Removing…' : result ? 'Run Again' : 'Remove Background'}
          </button>
          {result && <DownloadButton label="Download PNG" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
