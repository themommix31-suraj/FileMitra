import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { addTextWatermark, addImageWatermark } from '../pdf/watermarkPdf'
import { validateFile, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']
const IMAGE_ACCEPT = ['image/jpeg', 'image/png']

export default function WatermarkPdfTool() {
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('text') // 'text' | 'image'
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.25)
  const [imageFile, setImageFile] = useState(null)
  const [processing, setProcessing] = useState(false)
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

  const handleImageFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, IMAGE_ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setImageFile(f)
  }

  const handleApply = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = mode === 'text'
        ? await addTextWatermark(file, { text, opacity })
        : await addImageWatermark(file, imageFile, { opacity })
      setResult({ blob })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-watermarked' }))
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
    <div className="mx-auto max-w-xl">
      <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setResult(null) }} />

      <div className="mt-5 rounded-2xl border border-line bg-white p-5">
        <div className="flex gap-2 rounded-xl bg-mist p-1">
          <button type="button" onClick={() => setMode('text')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'text' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}>
            Text
          </button>
          <button type="button" onClick={() => setMode('image')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'image' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}>
            Image
          </button>
        </div>

        {mode === 'text' ? (
          <div className="mt-4">
            <label htmlFor="wmText" className="text-sm font-medium text-ink">Watermark text</label>
            <input id="wmText" type="text" value={text} onChange={(e) => setText(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-ink" />
          </div>
        ) : (
          <div className="mt-4">
            <label className="text-sm font-medium text-ink">Watermark image</label>
            <div className="mt-2">
              <UploadDropzone accept={IMAGE_ACCEPT} acceptLabel="a PNG or JPG image" maxSize={MAX_FILE_SIZE} onFiles={handleImageFiles} compact />
            </div>
            {imageFile && <p className="mt-2 text-xs text-ink-soft">Selected: {imageFile.name}</p>}
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="opacity" className="flex justify-between text-sm font-medium text-ink">
            <span>Opacity</span>
            <span className="text-ink-soft">{Math.round(opacity * 100)}%</span>
          </label>
          <input id="opacity" type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-brand-500)]" />
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Watermark applied to every page.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleApply}
            disabled={processing || (mode === 'text' ? !text.trim() : !imageFile)}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Applying…' : 'Add Watermark'}
          </button>
          {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
