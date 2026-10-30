import { useEffect, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import CopyButton from '../../components/CopyButton'
import { ocrImage } from '../image/ocrImage'
import { validateFile, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/gif']

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'hin', label: 'Hindi' },
  { code: 'eng+hin', label: 'English + Hindi' },
  { code: 'ben', label: 'Bengali' },
  { code: 'tam', label: 'Tamil' },
  { code: 'tel', label: 'Telugu' },
  { code: 'mar', label: 'Marathi' },
  { code: 'guj', label: 'Gujarati' },
  { code: 'pan', label: 'Punjabi' },
  { code: 'urd', label: 'Urdu' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'por', label: 'Portuguese' },
  { code: 'ara', label: 'Arabic' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
]

export default function ImageToTextTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [lang, setLang] = useState('eng')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, stage: '' })
  const [text, setText] = useState('')
  const [confidence, setConfidence] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => () => revokeObjectURL(previewUrl), [previewUrl])

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setText('')
    setConfidence(null)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setText('')
    setConfidence(null)
    setError(null)
  }

  const run = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setText('')
    setConfidence(null)
    setProgress({ percent: 0, stage: 'Preparing OCR engine…' })
    try {
      const result = await ocrImage(file, {
        lang,
        onProgress: (percent, stage) => setProgress((prev) => ({ percent: percent ?? prev.percent, stage })),
      })
      setText(result.text)
      setConfidence(result.confidence)
      if (!result.text) setError('No text was found in this image. Try a sharper, higher-resolution picture.')
    } catch (err) {
      setError(err?.code === 'OCR_LOAD' ? err.message : friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="an image with text" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="overflow-hidden rounded-2xl border border-line bg-mist">
          <img src={previewUrl} alt="Preview of the uploaded image" className="max-h-[380px] w-full object-contain" />
        </div>
        <ul className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </ul>

        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <label htmlFor="ocr-lang" className="text-sm font-medium text-ink">
            Language of the text
          </label>
          <select
            id="ocr-lang"
            value={lang}
            disabled={processing}
            onChange={(e) => setLang(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-ink-soft">The first run for a language downloads its data once; after that it is cached by your browser.</p>

          {processing && (
            <div className="mt-4">
              <ProgressBar value={progress.percent} label={progress.stage} />
            </div>
          )}

          <button
            type="button"
            onClick={run}
            disabled={processing}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Reading text…' : text ? 'Read again' : 'Extract text'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Extracted text</h2>
          {text && (
            <span className="text-xs text-ink-soft">
              {wordCount} words{confidence !== null ? ` · ~${confidence}% confidence` : ''}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          placeholder="The text found in your image will appear here — you can edit it before copying."
          className="mt-3 w-full resize-y rounded-xl border border-line bg-mist p-3 text-sm text-ink"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <CopyButton text={text} label="Copy text" />
          {text && <DownloadButton label="Download .txt" onClick={() => downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), suggestOutputName(file.name, { newExt: '.txt' }))} />}
        </div>
      </div>
    </div>
  )
}
