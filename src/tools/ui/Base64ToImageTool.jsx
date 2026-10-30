import { useEffect, useRef, useState } from 'react'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { base64ToImage } from '../image/imageBase64'
import { createObjectURL, revokeObjectURL, formatBytes } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' }

export default function Base64ToImageTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null) // { blob, url, mime }
  const [error, setError] = useState(null)
  const urlRef = useRef(null)

  useEffect(() => () => revokeObjectURL(urlRef.current), [])

  const handleConvert = () => {
    setError(null)
    try {
      const { blob, mime } = base64ToImage(input)
      revokeObjectURL(urlRef.current)
      const url = createObjectURL(blob)
      urlRef.current = url
      setResult({ blob, url, mime })
    } catch (err) {
      setResult(null)
      setError(err.message)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const ext = EXT_BY_MIME[result.mime] || '.png'
    downloadBlob(result.blob, `fileswift-image${ext}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Paste Base64</h2>
        <p className="mt-1 text-sm text-ink-soft">Paste a raw Base64 string or a full <code>data:image/...;base64,</code> URL.</p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={12}
          placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
          className="mt-4 w-full resize-none rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink"
        />

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        <button
          type="button"
          onClick={handleConvert}
          disabled={!input.trim()}
          className="mt-4 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
        >
          Convert to Image
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Preview</h2>
        <div className="mt-4 flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-mist">
          {result ? (
            <img src={result.url} alt="Decoded result" className="max-h-[280px] max-w-full object-contain" />
          ) : (
            <p className="p-6 text-center text-sm text-ink-soft">Your decoded image will appear here.</p>
          )}
        </div>
        {result && (
          <>
            <p className="mt-3 text-xs text-ink-soft">{result.mime} · {formatBytes(result.blob.size)}</p>
            <div className="mt-4">
              <DownloadButton label="Download Image" onClick={handleDownload} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
