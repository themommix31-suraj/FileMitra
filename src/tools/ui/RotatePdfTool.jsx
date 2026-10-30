import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { rotatePdf } from '../pdf/rotatePdf'
import { validateFile, formatBytes, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function RotatePdfTool() {
  const [file, setFile] = useState(null)
  const [degrees, setDegrees] = useState(90)
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

  const handleRotate = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await rotatePdf(file, { degrees })
      setResult({ blob, size: blob.size })
    } catch {
      setError('This file doesn\u2019t look like a valid PDF. Please try another file.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-rotated' }))
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
        <h2 className="font-display text-lg font-semibold text-ink">Rotate all pages</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[90, 180, 270].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDegrees(d)}
              aria-pressed={degrees === d}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                degrees === d ? 'border-[var(--color-brand-500)] bg-brand-50 text-ink' : 'border-line bg-mist text-ink hover:bg-white'
              }`}
            >
              <RotateCw className="h-4 w-4" /> {d}°
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! All pages rotated {degrees}° ({formatBytes(result.size)}).</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRotate}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Rotating…' : 'Rotate PDF'}
          </button>
          {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
