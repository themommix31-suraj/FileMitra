import { useEffect, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { getPdfThumbnails, pdfToImages } from '../pdf/pdfToJpg'
import { validateFile, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, downloadAsZip, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function PdfToJpgTool({ format = 'jpeg' } = {}) {
  const ext = format === 'png' ? 'png' : 'jpg'
  const label = format === 'png' ? 'PNG' : 'JPG'
  const [file, setFile] = useState(null)
  const [thumbs, setThumbs] = useState([]) // { pageNumber, url }
  const [selected, setSelected] = useState(new Set())
  const [loadingThumbs, setLoadingThumbs] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null) // [{pageNumber, blob}]
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => thumbs.forEach((t) => revokeObjectURL(t.url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    setLoadingThumbs(true)
    try {
      const pages = await getPdfThumbnails(f)
      setThumbs(pages)
      setSelected(new Set(pages.map((p) => p.pageNumber)))
    } catch {
      setError('This file doesn\u2019t look like a valid PDF. Please try another file.')
    } finally {
      setLoadingThumbs(false)
    }
  }

  const toggle = (pageNumber) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pageNumber)) next.delete(pageNumber)
      else next.add(pageNumber)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(thumbs.map((t) => t.pageNumber)))
  const selectNone = () => setSelected(new Set())

  const handleConvert = async () => {
    if (!file || selected.size === 0) return
    setProcessing(true)
    setError(null)
    setProgress(0)
    try {
      const pages = Array.from(selected).sort((a, b) => a - b)
      const images = await pdfToImages(file, {
        pages,
        scale: 2,
        quality: 0.9,
        format,
        onProgress: (done, total) => setProgress((done / total) * 100),
      })
      setResults(images)
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!results) return
    if (results.length === 1) {
      downloadBlob(results[0].blob, suggestOutputName(file.name, { suffix: `-page-${results[0].pageNumber}`, newExt: `.${ext}` }))
    } else {
      await downloadAsZip(
        results.map((r) => ({ name: suggestOutputName(file.name, { suffix: `-page-${r.pageNumber}`, newExt: `.${ext}` }), blob: r.blob })),
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
    <div>
      <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setThumbs([]); setResults(null) }} />

      {loadingThumbs && <p className="mt-4 text-sm text-ink-soft">Reading PDF pages…</p>}

      {thumbs.length > 0 && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-ink-soft">{selected.size} of {thumbs.length} pages selected</p>
            <div className="flex gap-3 text-sm font-semibold" style={{ color: 'var(--color-brand-600)' }}>
              <button type="button" onClick={selectAll}>Select all</button>
              <button type="button" onClick={selectNone}>Select none</button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {thumbs.map((t) => (
              <button
                key={t.pageNumber}
                type="button"
                onClick={() => toggle(t.pageNumber)}
                aria-pressed={selected.has(t.pageNumber)}
                className={`relative overflow-hidden rounded-xl border-2 transition-colors ${
                  selected.has(t.pageNumber) ? 'border-[var(--color-brand-500)]' : 'border-line'
                }`}
              >
                <img src={t.url} alt={`Page ${t.pageNumber}`} className="aspect-[3/4] w-full object-cover" />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {t.pageNumber}
                </span>
              </button>
            ))}
          </div>

          {processing && (
            <div className="mt-5">
              <ProgressBar value={progress} label="Converting pages…" />
            </div>
          )}

          {error && (
            <div className="mt-4">
              <StatusBanner type="error">{error}</StatusBanner>
            </div>
          )}
          {results && !error && (
            <div className="mt-4">
              <StatusBanner type="success">Done! Converted {results.length} page{results.length === 1 ? '' : 's'} to {label}.</StatusBanner>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleConvert}
              disabled={processing || selected.size === 0}
              className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60 sm:max-w-xs"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              {processing ? 'Converting…' : `Convert ${selected.size} page${selected.size === 1 ? '' : 's'}`}
            </button>
            {results && <DownloadButton label={results.length > 1 ? 'Download All (ZIP)' : `Download ${label}`} onClick={handleDownload} />}
          </div>
        </>
      )}
    </div>
  )
}
