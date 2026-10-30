import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { addPageNumbers } from '../pdf/pageNumbersPdf'
import { validateFile, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']
const POSITIONS = [
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'top-left', label: 'Top left' },
]

export default function PageNumbersPdfTool() {
  const [file, setFile] = useState(null)
  const [position, setPosition] = useState('bottom-center')
  const [startAt, setStartAt] = useState(1)
  const [format, setFormat] = useState('{n}')
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
      const blob = await addPageNumbers(file, { position, startAt: Number(startAt) || 1, format })
      setResult({ blob })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-numbered' }))
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
        <h2 className="font-display text-lg font-semibold text-ink">Page number settings</h2>

        <div className="mt-4">
          <label htmlFor="position" className="text-sm font-medium text-ink">Position</label>
          <select id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startAt" className="text-sm font-medium text-ink">Start at</label>
            <input id="startAt" type="number" min="0" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-ink" />
          </div>
          <div>
            <label htmlFor="format" className="text-sm font-medium text-ink">Format</label>
            <input id="format" type="text" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Page {n} of {total}" className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-ink" />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-soft">Use <code>{'{n}'}</code> for the page number and <code>{'{total}'}</code> for the total pages.</p>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Page numbers were added.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleApply}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Applying…' : 'Add Page Numbers'}
          </button>
          {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
