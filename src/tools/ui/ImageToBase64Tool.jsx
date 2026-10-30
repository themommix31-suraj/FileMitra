import { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { imageToBase64 } from '../image/imageBase64'
import { validateFile, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageToBase64Tool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [output, setOutput] = useState(null) // { dataUrl, base64 }
  const [asDataUrl, setAsDataUrl] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleFiles = async (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
    try {
      const res = await imageToBase64(f)
      setOutput(res)
    } catch (err) {
      setError(friendlyErrorMessage(err))
    }
  }

  const text = output ? (asDataUrl ? output.dataUrl : output.base64) : ''

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

  const reset = () => {
    revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setOutput(null)
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
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div>
        <div className="overflow-hidden rounded-2xl border border-line bg-mist">
          <img src={previewUrl} alt="Preview of the uploaded image" className="max-h-[320px] w-full object-contain" />
        </div>
        <div className="mt-3">
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Base64 output</h2>
          <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <input type="checkbox" checked={asDataUrl} onChange={(e) => setAsDataUrl(e.target.checked)} className="accent-[var(--color-brand-500)]" />
            Include data: URL prefix
          </label>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        <textarea
          readOnly
          value={text}
          rows={10}
          className="mt-4 w-full resize-none rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <DownloadButton label="Download as .txt" onClick={handleDownload} />
        </div>
      </div>
    </div>
  )
}
