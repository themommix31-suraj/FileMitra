import { useEffect, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { getPdfThumbnails } from '../pdf/pdfToJpg'
import { deletePdfPages } from '../pdf/deletePdfPages'
import { extractPdfPages } from '../pdf/extractPdfPages'
import { validateFile, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

/**
 * Shared page-thumbnail picker for "Delete PDF Pages" and "Extract PDF Pages" —
 * the interaction is identical, only the resulting operation differs.
 * @param {{ mode: 'delete'|'extract' }} props
 */
export default function PageSelectPdfTool({ mode = 'delete' }) {
  const [file, setFile] = useState(null)
  const [thumbs, setThumbs] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loadingThumbs, setLoadingThumbs] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const isDelete = mode === 'delete'
  const label = isDelete ? 'Delete' : 'Extract'
  const verb = isDelete ? 'delete' : 'extract'

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
    setResult(null)
    setFile(f)
    setLoadingThumbs(true)
    try {
      const pages = await getPdfThumbnails(f)
      setThumbs(pages)
      setSelected(new Set())
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

  const handleRun = async () => {
    if (!file || selected.size === 0) return
    setProcessing(true)
    setError(null)
    try {
      const pages = Array.from(selected).sort((a, b) => a - b)
      const blob = isDelete ? await deletePdfPages(file, pages) : await extractPdfPages(file, pages)
      setResult({ blob, pages })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: isDelete ? '-edited' : '-extracted' }))
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
      <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setThumbs([]); setResult(null) }} />

      {loadingThumbs && <p className="mt-4 text-sm text-ink-soft">Reading PDF pages…</p>}

      {thumbs.length > 0 && (
        <>
          <p className="mt-5 text-sm text-ink-soft">
            Click the pages you want to {verb} ({selected.size} of {thumbs.length} selected).
          </p>

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
                {selected.has(t.pageNumber) && (
                  <span
                    className="absolute inset-0"
                    style={{ background: 'color-mix(in srgb, var(--color-brand-500) 25%, transparent)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4">
              <StatusBanner type="error">{error}</StatusBanner>
            </div>
          )}
          {result && !error && (
            <div className="mt-4">
              <StatusBanner type="success">
                Done! {isDelete ? `Removed ${result.pages.length} page${result.pages.length === 1 ? '' : 's'}.` : `Extracted ${result.pages.length} page${result.pages.length === 1 ? '' : 's'}.`}
              </StatusBanner>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRun}
              disabled={processing || selected.size === 0}
              className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60 sm:max-w-xs"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              {processing ? `${label}ing…` : `${label} ${selected.size} page${selected.size === 1 ? '' : 's'}`}
            </button>
            {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
          </div>
        </>
      )}
    </div>
  )
}
