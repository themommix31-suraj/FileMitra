import { useEffect, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { getPdfThumbnails } from '../pdf/pdfToJpg'
import { cropPdf } from '../pdf/cropPdf'
import { validateFile, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function CropPdfTool() {
  const [file, setFile] = useState(null)
  const [thumb, setThumb] = useState(null)
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 })
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => () => revokeObjectURL(thumb?.url), [thumb])

  const handleFiles = async (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setResult(null)
    setFile(f)
    try {
      const pages = await getPdfThumbnails(f, { scale: 0.9 })
      setThumb(pages[0] || null)
    } catch {
      setError('This file doesn\u2019t look like a valid PDF. Please try another file.')
    }
  }

  const setMargin = (side, value) => setMargins((prev) => ({ ...prev, [side]: Math.max(0, Number(value) || 0) }))

  const handleCrop = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await cropPdf(file, margins)
      setResult({ blob })
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
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        {thumb ? (
          <div className="relative overflow-hidden rounded-2xl border border-line bg-mist">
            <img src={thumb.url} alt="First page preview" className="w-full object-contain" />
            <div
              className="pointer-events-none absolute border-2"
              style={{
                top: `${margins.top / 8}%`,
                bottom: `${margins.bottom / 8}%`,
                left: `${margins.left / 8}%`,
                right: `${margins.right / 8}%`,
                borderColor: 'var(--color-brand-500)',
                background: 'color-mix(in srgb, var(--color-brand-500) 10%, transparent)',
              }}
            />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line bg-mist text-sm text-ink-soft">Loading preview…</div>
        )}
        <p className="mt-2 text-xs text-ink-soft">Preview shows page 1. Margins apply to every page equally.</p>
        <div className="mt-3">
          <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setThumb(null); setResult(null) }} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Crop margins (points)</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {['top', 'bottom', 'left', 'right'].map((side) => (
            <div key={side}>
              <label htmlFor={side} className="text-sm font-medium capitalize text-ink">{side}</label>
              <input
                id={side}
                type="number"
                min="0"
                value={margins[side]}
                onChange={(e) => setMargin(side, e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-ink"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">1 inch ≈ 72 points.</p>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Your PDF was cropped.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCrop}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Cropping…' : 'Crop PDF'}
          </button>
          {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
