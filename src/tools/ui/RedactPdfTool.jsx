import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { getPdfThumbnails } from '../pdf/pdfToJpg'
import { redactPdf } from '../pdf/redactPdf'
import { validateFile, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function RedactPdfTool() {
  const [file, setFile] = useState(null)
  const [thumbs, setThumbs] = useState([])
  const [activePage, setActivePage] = useState(1)
  const [boxesByPage, setBoxesByPage] = useState({}) // { [pageNumber]: [{x,y,w,h}] }
  const [loadingThumbs, setLoadingThumbs] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const wrapRef = useRef(null)

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
      const pages = await getPdfThumbnails(f, { scale: 0.9 })
      setThumbs(pages)
      setActivePage(1)
      setBoxesByPage({})
    } catch {
      setError('This file doesn\u2019t look like a valid PDF. Please try another file.')
    } finally {
      setLoadingThumbs(false)
    }
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v))
  const toFraction = (e) => {
    const box = wrapRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clamp01((clientX - box.left) / box.width), y: clamp01((clientY - box.top) / box.height) }
  }

  const startDrag = (e) => {
    e.preventDefault()
    const start = toFraction(e)
    let current = { x: start.x, y: start.y, w: 0, h: 0 }

    const onMove = (moveEvent) => {
      const cur = toFraction(moveEvent)
      current = { x: Math.min(start.x, cur.x), y: Math.min(start.y, cur.y), w: Math.abs(cur.x - start.x), h: Math.abs(cur.y - start.y) }
      setBoxesByPage((prev) => ({ ...prev, [`__draft_${activePage}`]: current }))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
      setBoxesByPage((prev) => {
        const next = { ...prev }
        delete next[`__draft_${activePage}`]
        if (current.w > 0.005 && current.h > 0.005) {
          next[activePage] = [...(next[activePage] || []), current]
        }
        return next
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const removeBox = (pageNumber, index) => {
    setBoxesByPage((prev) => ({ ...prev, [pageNumber]: prev[pageNumber].filter((_, i) => i !== index) }))
  }

  const totalBoxes = Object.entries(boxesByPage)
    .filter(([k]) => !k.startsWith('__draft'))
    .reduce((sum, [, boxes]) => sum + boxes.length, 0)

  const handleRedact = async () => {
    if (!file || totalBoxes === 0) return
    setProcessing(true)
    setError(null)
    setProgress(0)
    try {
      const clean = Object.fromEntries(Object.entries(boxesByPage).filter(([k]) => !k.startsWith('__draft')).map(([k, v]) => [Number(k), v]))
      const blob = await redactPdf(file, clean, { onProgress: (done, total) => setProgress((done / total) * 100) })
      setResult({ blob })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-redacted' }))
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

  const activeThumb = thumbs.find((t) => t.pageNumber === activePage)
  const activeBoxes = boxesByPage[activePage] || []
  const draftBox = boxesByPage[`__draft_${activePage}`]

  return (
    <div>
      <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setThumbs([]); setResult(null); setBoxesByPage({}) }} />

      {loadingThumbs && <p className="mt-4 text-sm text-ink-soft">Reading PDF pages…</p>}

      {thumbs.length > 0 && (
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            {thumbs.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {thumbs.map((t) => (
                  <button
                    key={t.pageNumber}
                    type="button"
                    onClick={() => setActivePage(t.pageNumber)}
                    className={`relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border-2 ${activePage === t.pageNumber ? 'border-[var(--color-brand-500)]' : 'border-line'}`}
                  >
                    <img src={t.url} alt={`Page ${t.pageNumber}`} className="h-full w-full object-cover" />
                    {(boxesByPage[t.pageNumber] || []).length > 0 && (
                      <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-rose-500 text-[9px] font-bold text-white">
                        {boxesByPage[t.pageNumber].length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="mb-2 text-xs text-ink-soft">Drag on the page to black out an area. You can add multiple boxes per page.</p>
            <div
              ref={wrapRef}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
              className="relative select-none overflow-hidden rounded-2xl border border-line bg-mist"
              style={{ touchAction: 'none' }}
            >
              {activeThumb && <img src={activeThumb.url} alt={`Page ${activePage}`} className="block w-full object-contain" draggable={false} />}
              {activeBoxes.map((b, i) => (
                <div key={i} className="group absolute bg-black" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}>
                  <button
                    type="button"
                    onClick={() => removeBox(activePage, i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    aria-label="Remove this redaction"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {draftBox && draftBox.w > 0 && draftBox.h > 0 && (
                <div className="absolute border-2 border-rose-500 bg-black/70" style={{ left: `${draftBox.x * 100}%`, top: `${draftBox.y * 100}%`, width: `${draftBox.w * 100}%`, height: `${draftBox.h * 100}%` }} />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Redaction</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Each page is rasterized before redacting, so the blacked-out content is permanently removed — not just visually covered.
            </p>

            <div className="mt-4 rounded-xl bg-mist p-3 text-sm">
              <p className="text-ink-soft">Redaction boxes</p>
              <p className="font-semibold text-ink">{totalBoxes} across {thumbs.length} page{thumbs.length === 1 ? '' : 's'}</p>
            </div>

            {processing && (
              <div className="mt-4">
                <ProgressBar value={progress} label="Redacting pages…" />
              </div>
            )}

            {error && (
              <div className="mt-4">
                <StatusBanner type="error">{error}</StatusBanner>
              </div>
            )}
            {result && !error && (
              <div className="mt-4">
                <StatusBanner type="success">Done! Redacted content was permanently removed.</StatusBanner>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRedact}
                disabled={processing || totalBoxes === 0}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
              >
                {processing ? 'Redacting…' : 'Apply Redactions'}
              </button>
              {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
