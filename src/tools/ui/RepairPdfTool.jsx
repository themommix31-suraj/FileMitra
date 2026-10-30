import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { repairPdf } from '../pdf/repairPdf'
import { validateFile, formatBytes, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function RepairPdfTool() {
  const [file, setFile] = useState(null)
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

  const handleRepair = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await repairPdf(file)
      setResult({ blob, size: blob.size })
    } catch (err) {
      setError(err.message || 'Could not repair this PDF.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-repaired' }))
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
        <h2 className="font-display text-lg font-semibold text-ink">Repair this PDF</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Rebuilds the file's internal structure to fix common issues like broken cross-reference tables or corrupted trailers. It can't recover data that's genuinely missing from a severely damaged file.
        </p>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Rebuilt a clean copy ({formatBytes(result.size)}).</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRepair}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Repairing…' : 'Repair PDF'}
          </button>
          {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
