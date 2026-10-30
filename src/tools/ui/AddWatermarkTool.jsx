import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { addWatermark } from '../pdf/addWatermark'
import { validateFile, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function AddWatermarkTool() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.25)
  const [rotation, setRotation] = useState(45)
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState('#64748b')
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

  const handleApply = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await addWatermark(file, { text, opacity, rotation, fontSize, color })
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
        <h2 className="font-display text-lg font-semibold text-ink">Watermark settings</h2>

        <div className="mt-4">
          <label htmlFor="wmText" className="text-sm font-medium text-ink">Watermark text</label>
          <input id="wmText" type="text" value={text} onChange={(e) => setText(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-ink" />
        </div>

        <div className="mt-4">
          <label htmlFor="opacity" className="flex justify-between text-sm font-medium text-ink">
            <span>Opacity</span>
            <span className="text-ink-soft">{Math.round(opacity * 100)}%</span>
          </label>
          <input id="opacity" type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-brand-500)]" />
        </div>

        <div className="mt-4">
          <label htmlFor="rotation" className="flex justify-between text-sm font-medium text-ink">
            <span>Rotation</span>
            <span className="text-ink-soft">{rotation}°</span>
          </label>
          <input id="rotation" type="range" min="0" max="90" step="5" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-brand-500)]" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fontSize" className="flex justify-between text-sm font-medium text-ink">
              <span>Size</span>
              <span className="text-ink-soft">{fontSize}pt</span>
            </label>
            <input id="fontSize" type="range" min="16" max="96" step="2" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-brand-500)]" />
          </div>
          <div>
            <label htmlFor="wmColor" className="text-sm font-medium text-ink">Color</label>
            <input id="wmColor" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-mist" />
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Watermark added to every page.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleApply}
            disabled={processing || !text.trim()}
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
