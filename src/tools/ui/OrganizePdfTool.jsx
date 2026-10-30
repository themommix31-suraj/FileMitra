import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Trash2, GripVertical } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { getPdfThumbnails } from '../pdf/pdfToJpg'
import { organizePdf } from '../pdf/organizePdf'
import { validateFile, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

const iconBtn = 'rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-mist hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent'

export default function OrganizePdfTool() {
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState([]) // { id, pageNumber, url, rotation }
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const dragFrom = useRef(null)
  const originalRef = useRef([]) // all thumbnails of the loaded file, for "Reset"
  const urlsRef = useRef([])

  const freeUrls = () => {
    urlsRef.current.forEach(revokeObjectURL)
    urlsRef.current = []
  }
  useEffect(() => () => freeUrls(), [])

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
    setLoading(true)
    freeUrls()
    try {
      const thumbs = await getPdfThumbnails(f, { scale: 0.5 })
      urlsRef.current = thumbs.map((t) => t.url)
      const list = thumbs.map((t) => ({ id: t.pageNumber, pageNumber: t.pageNumber, url: t.url, rotation: 0 }))
      originalRef.current = list
      setPages(list)
    } catch {
      setError('This file doesn\u2019t look like a valid PDF. Please try another file.')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  const change = (updater) => {
    setResult(null)
    setPages(updater)
  }

  const move = (from, to) => {
    if (to < 0 || to >= pages.length || from === to) return
    change((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }
  const rotate = (id) => change((prev) => prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)))
  const remove = (id) => change((prev) => prev.filter((p) => p.id !== id))
  const reverse = () => change((prev) => [...prev].reverse())
  const resetAll = () => change(() => originalRef.current.map((p) => ({ ...p, rotation: 0 })))

  const reorderedOrRemoved =
    pages.length !== originalRef.current.length || pages.some((p, i) => p.pageNumber !== i + 1 || p.rotation !== 0)

  const run = async () => {
    setProcessing(true)
    setError(null)
    try {
      const blob = await organizePdf(file, pages.map((p) => ({ index: p.pageNumber - 1, rotation: p.rotation })))
      setResult({ blob, count: pages.length })
    } catch (err) {
      setError(/password|corrupt|keep at least/i.test(err?.message || '') ? err.message : friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const clearFile = () => {
    freeUrls()
    setFile(null)
    setPages([])
    setResult(null)
    setError(null)
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
      <ul>
        <FilePreview name={file.name} size={file.size} onRemove={clearFile} />
      </ul>

      {loading && <p className="mt-4 text-sm text-ink-soft">Reading PDF pages…</p>}

      {pages.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              Drag pages to reorder them, or use the arrows. {pages.length} of {originalRef.current.length} pages kept.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={reverse} className="rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-mist">
                Reverse order
              </button>
              <button type="button" onClick={resetAll} disabled={!reorderedOrRemoved} className="rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-mist disabled:opacity-40">
                Reset
              </button>
            </div>
          </div>

          <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pages.map((p, i) => (
              <li
                key={p.id}
                draggable
                onDragStart={() => {
                  dragFrom.current = i
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverIndex(i)
                }}
                onDragLeave={() => setOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragFrom.current !== null) move(dragFrom.current, i)
                  dragFrom.current = null
                  setOverIndex(null)
                }}
                onDragEnd={() => {
                  dragFrom.current = null
                  setOverIndex(null)
                }}
                className={`rounded-xl border-2 bg-white p-2 shadow-sm transition-colors ${overIndex === i ? 'border-[var(--color-brand-500)]' : 'border-line'}`}
              >
                <div className="relative flex aspect-[3/4] cursor-grab items-center justify-center overflow-hidden rounded-lg bg-mist">
                  <img
                    src={p.url}
                    alt={`Page ${p.pageNumber}`}
                    draggable={false}
                    className="h-full w-full object-contain transition-transform"
                    style={{ transform: `rotate(${p.rotation}deg) scale(${p.rotation % 180 ? 0.75 : 1})` }}
                  />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{i + 1}</span>
                  <GripVertical className="absolute right-1 top-1 h-4 w-4 text-ink-soft/60" aria-hidden="true" />
                </div>
                <p className="mt-1 text-center text-[11px] text-ink-soft">was page {p.pageNumber}</p>
                <div className="mt-1 flex items-center justify-center">
                  <button type="button" className={iconBtn} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move page ${p.pageNumber} earlier`}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconBtn} onClick={() => rotate(p.id)} aria-label={`Rotate page ${p.pageNumber}`}>
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button type="button" className={`${iconBtn} hover:!bg-rose-50 hover:!text-rose-500`} onClick={() => remove(p.id)} disabled={pages.length === 1} aria-label={`Delete page ${p.pageNumber}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconBtn} onClick={() => move(i, i + 1)} disabled={i === pages.length - 1} aria-label={`Move page ${p.pageNumber} later`}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>

          {error && (
            <div className="mt-4">
              <StatusBanner type="error">{error}</StatusBanner>
            </div>
          )}
          {result && !error && (
            <div className="mt-4">
              <StatusBanner type="success">Done! Your new PDF has {result.count} page{result.count === 1 ? '' : 's'} in the order shown.</StatusBanner>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={run}
              disabled={processing}
              className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60 sm:max-w-xs"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              {processing ? 'Saving…' : 'Apply changes'}
            </button>
            {result && <DownloadButton label="Download PDF" onClick={() => downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-reordered' }))} />}
          </div>
        </>
      )}
    </div>
  )
}
