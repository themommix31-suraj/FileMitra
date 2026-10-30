import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { pdfToText } from '../pdf/pdfToText'
import { validateFile, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function PdfToTextTool() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [text, setText] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setText(null)
    setFile(f)
  }

  const handleExtract = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setProgress(0)
    try {
      const result = await pdfToText(file, { onProgress: (done, total) => setProgress((done / total) * 100) })
      setText(result)
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    if (!text || !file) return
    downloadBlob(new Blob([text], { type: 'text/plain' }), suggestOutputName(file.name, { newExt: '.txt' }))
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
    <div className="mx-auto max-w-2xl">
      <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setText(null) }} />

      <div className="mt-5 rounded-2xl border border-line bg-white p-5">
        {processing && (
          <div className="mb-4">
            <ProgressBar value={progress} label="Reading pages…" />
          </div>
        )}

        {error && (
          <div className="mb-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {text && !error && (
          <div className="mb-4">
            <StatusBanner type="success">Text extracted successfully.</StatusBanner>
          </div>
        )}

        {text ? (
          <textarea readOnly value={text} rows={14} className="w-full resize-none rounded-xl border border-line bg-mist p-3 text-sm text-ink" />
        ) : (
          <button
            type="button"
            onClick={handleExtract}
            disabled={processing}
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Extracting…' : 'Extract Text'}
          </button>
        )}

        {text && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <DownloadButton label="Download as .txt" onClick={handleDownload} />
          </div>
        )}
      </div>
    </div>
  )
}
