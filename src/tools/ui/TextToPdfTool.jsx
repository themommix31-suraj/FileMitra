import { useState } from 'react'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { textToPdf } from '../pdf/textToPdf'
import { friendlyErrorMessage } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

export default function TextToPdfTool() {
  const [text, setText] = useState('')
  const [pageSize, setPageSize] = useState('a4')
  const [fontSize, setFontSize] = useState(12)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Type or paste some text first.')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const blob = await textToPdf(text, { pageSize, fontSize })
      setResult({ blob })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    downloadBlob(result.blob, 'fileswift-text.pdf')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Your text</h2>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null) }}
          rows={16}
          placeholder="Type or paste your text here…"
          className="mt-3 w-full resize-none rounded-xl border border-line bg-mist p-3 text-sm text-ink"
        />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">PDF settings</h2>

        <div className="mt-4">
          <label htmlFor="pageSize" className="text-sm font-medium text-ink">Page size</label>
          <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="fontSize" className="flex justify-between text-sm font-medium text-ink">
            <span>Font size</span>
            <span className="text-ink-soft">{fontSize}pt</span>
          </label>
          <input id="fontSize" type="range" min="9" max="20" step="1" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-brand-500)]" />
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Your PDF is ready.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Generating…' : 'Generate PDF'}
          </button>
          {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
