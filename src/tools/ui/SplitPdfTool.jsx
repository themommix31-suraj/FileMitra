import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { splitPdf, getPdfPageCountLib } from '../pdf/splitPdf'
import { validateFile, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadAsZip, downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function SplitPdfTool() {
  const [file, setFile] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [rangesText, setRangesText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleFiles = async (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setResults(null)
    setFile(f)
    try {
      const count = await getPdfPageCountLib(f)
      setPageCount(count)
      setRangesText(count > 1 ? `1-${Math.ceil(count / 2)}, ${Math.ceil(count / 2) + 1}-${count}` : '1-1')
    } catch {
      setError('This file doesn\u2019t look like a valid PDF. Please try another file.')
    }
  }

  const parseRanges = () => {
    const parts = rangesText.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length === 0) throw new Error('Enter at least one page range, e.g. "1-3, 4-6".')
    return parts.map((part) => {
      const m = part.match(/^(\d+)\s*-\s*(\d+)$/) || part.match(/^(\d+)$/)
      if (!m) throw new Error(`"${part}" isn\u2019t a valid range. Use formats like "1-3" or "5".`)
      const start = Number(m[1])
      const end = m[2] ? Number(m[2]) : Number(m[1])
      if (start < 1 || end < start) throw new Error(`"${part}" isn\u2019t a valid page range.`)
      return { start, end }
    })
  }

  const handleSplit = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const ranges = parseRanges()
      const parts = await splitPdf(file, ranges)
      setResults(parts)
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!results) return
    if (results.length === 1) {
      downloadBlob(results[0].blob, suggestOutputName(file.name, { suffix: `-pages-${results[0].range}` }))
    } else {
      await downloadAsZip(
        results.map((r) => ({ name: suggestOutputName(file.name, { suffix: `-pages-${r.range}` }), blob: r.blob })),
        suggestOutputName(file.name, { newExt: '.zip' })
      )
    }
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
      <FilePreview name={file.name} size={file.size} extraInfo={pageCount ? `${pageCount} pages` : undefined} onRemove={() => { setFile(null); setResults(null) }} />

      <div className="mt-5 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Page ranges</h2>
        <p className="mt-1 text-sm text-ink-soft">Separate multiple ranges with commas — each becomes its own PDF.</p>
        <input
          type="text"
          value={rangesText}
          onChange={(e) => setRangesText(e.target.value)}
          placeholder="1-3, 4-6"
          className="mt-3 w-full rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-ink"
        />

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {results && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Created {results.length} PDF{results.length === 1 ? '' : 's'}.</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSplit}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Splitting…' : 'Split PDF'}
          </button>
          {results && <DownloadButton label={results.length > 1 ? 'Download All (ZIP)' : 'Download PDF'} onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
