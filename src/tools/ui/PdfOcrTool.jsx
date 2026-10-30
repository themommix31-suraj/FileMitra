import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { ocrPdf, ocrResultToText } from '../pdf/ocrPdf'
import { validateFile, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'por', label: 'Portuguese' },
  { code: 'hin', label: 'Hindi' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'ara', label: 'Arabic' },
]

export default function PdfOcrTool() {
  const [file, setFile] = useState(null)
  const [lang, setLang] = useState('eng')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, stage: '' })
  const [text, setText] = useState('')
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
    setText('')
    setFile(f)
  }

  const handleRun = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setText('')
    setProgress({ done: 0, total: 0, stage: 'Starting…' })
    try {
      const pages = await ocrPdf(file, {
        lang,
        onProgress: (done, total, stage) => {
          setProgress({ done, total, stage: stage === 'rendering' ? 'Rendering page…' : stage === 'reading' ? 'Reading text…' : 'Done' })
        },
      })
      setText(ocrResultToText(pages))
    } catch (err) {
      setError(err.message || friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!text || !file) return
    const blob = new Blob([text], { type: 'text/plain' })
    downloadBlob(blob, suggestOutputName(file.name, { newExt: '.txt' }))
  }

  const handleCopy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const reset = () => {
    setFile(null)
    setText('')
    setError(null)
  }

  const percent = progress.total ? (progress.done / progress.total) * 100 : 0

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="a scanned PDF" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Extract text with OCR</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Reads scanned or image-only PDFs using on-device optical character recognition — nothing is uploaded.
          Works best on clear, high-resolution scans, up to 25 pages.
        </p>

        <div className="mt-4">
          <FilePreview name={file.name} size={file.size} onRemove={reset} />
        </div>

        <label className="mt-4 block text-sm font-medium text-ink">
          Document language
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={processing}
            className="mt-1.5 w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        {processing && (
          <div className="mt-4">
            <ProgressBar value={percent} label={`${progress.stage} (page ${progress.done}/${progress.total || '?'})`} />
          </div>
        )}

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        <button
          type="button"
          onClick={handleRun}
          disabled={processing}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
        >
          {processing ? 'Running OCR…' : 'Run OCR'}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Extracted text</h2>
        {text && !error && (
          <div className="mt-3">
            <StatusBanner type="success">Done! Text extracted from your PDF.</StatusBanner>
          </div>
        )}
        <textarea
          readOnly
          value={text}
          rows={14}
          placeholder="Extracted text will appear here…"
          className="mt-3 w-full resize-none rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-mist px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white disabled:opacity-60"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          {text && <DownloadButton label="Download .txt" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
