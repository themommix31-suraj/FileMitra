import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { getPdfThumbnails } from '../pdf/pdfToJpg'
import { signPdf } from '../pdf/signPdf'
import { validateFile, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']
const SIG_WIDTH_FRACTION = 0.28

export default function SignPdfTool() {
  const [file, setFile] = useState(null)
  const [thumbs, setThumbs] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [mode, setMode] = useState('draw') // 'draw' | 'type'
  const [typedName, setTypedName] = useState('')
  const [hasDrawing, setHasDrawing] = useState(false)
  const [placement, setPlacement] = useState({ x: 0.35, y: 0.75 }) // fractional top-left on the page
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const pageWrapRef = useRef(null)

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
    try {
      const pages = await getPdfThumbnails(f, { scale: 0.9 })
      setThumbs(pages)
      setPageNumber(1)
    } catch {
      setError('This file doesn\u2019t look like a valid PDF. Please try another file.')
    }
  }

  const getCtx = () => canvasRef.current?.getContext('2d')

  const pointerPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
  }

  const startDraw = (e) => {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = getCtx()
    const { x, y } = pointerPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  const moveDraw = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = getCtx()
    const { x, y } = pointerPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
    setHasDrawing(true)
  }
  const endDraw = () => { drawing.current = false }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    getCtx()?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }

  const buildSignatureBlob = async () => {
    if (mode === 'draw') {
      if (!hasDrawing) throw new Error('Draw your signature first.')
      return new Promise((resolve, reject) => {
        canvasRef.current.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not capture the signature.'))), 'image/png')
      })
    }
    if (!typedName.trim()) throw new Error('Type your name first.')
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    ctx.font = 'italic 64px Georgia, "Times New Roman", serif'
    ctx.fillStyle = '#0f172a'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedName.trim(), 20, 100)
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render the signature.'))), 'image/png')
    })
  }

  const handleDropOnPage = (e) => {
    if (!pageWrapRef.current) return
    const rect = pageWrapRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    setPlacement({ x, y })
  }

  const handleSign = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const sigBlob = await buildSignatureBlob()
      const blob = await signPdf(file, sigBlob, {
        pageNumber,
        x: placement.x,
        y: placement.y,
        width: SIG_WIDTH_FRACTION,
        height: SIG_WIDTH_FRACTION * (mode === 'draw' ? 0.4 : 200 / 600),
      })
      setResult({ blob })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-signed' }))
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

  const activeThumb = thumbs.find((t) => t.pageNumber === pageNumber)

  return (
    <div>
      <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setThumbs([]); setResult(null) }} />

      <div className="mt-3 rounded-xl border border-dashed p-3 text-xs" style={{ borderColor: 'color-mix(in srgb, var(--color-brand-500) 40%, white)', color: 'var(--color-ink-soft)' }}>
        This places a visual signature stamp on the page — it's not a legally-binding cryptographic signature.
      </div>

      {thumbs.length > 0 && (
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            {thumbs.length > 1 && (
              <div className="mb-3">
                <label htmlFor="pageNumber" className="text-sm font-medium text-ink">Page to sign</label>
                <select id="pageNumber" value={pageNumber} onChange={(e) => setPageNumber(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
                  {thumbs.map((t) => (
                    <option key={t.pageNumber} value={t.pageNumber}>Page {t.pageNumber}</option>
                  ))}
                </select>
              </div>
            )}

            <p className="mb-2 text-xs text-ink-soft">Click anywhere on the page to place your signature there.</p>
            <div ref={pageWrapRef} onClick={handleDropOnPage} className="relative cursor-crosshair overflow-hidden rounded-2xl border border-line bg-mist">
              {activeThumb && <img src={activeThumb.url} alt={`Page ${pageNumber}`} className="block w-full object-contain" draggable={false} />}
              <div
                className="pointer-events-none absolute flex items-center justify-center border-2 border-dashed text-[10px] font-semibold"
                style={{
                  left: `${placement.x * 100}%`,
                  top: `${placement.y * 100}%`,
                  width: `${SIG_WIDTH_FRACTION * 100}%`,
                  height: `${SIG_WIDTH_FRACTION * (mode === 'draw' ? 0.4 : 200 / 600) * 100}%`,
                  borderColor: 'var(--color-brand-500)',
                  color: 'var(--color-brand-600)',
                  background: 'color-mix(in srgb, var(--color-brand-500) 12%, transparent)',
                }}
              >
                Signature
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex gap-2 rounded-xl bg-mist p-1">
              <button type="button" onClick={() => setMode('draw')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'draw' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}>Draw</button>
              <button type="button" onClick={() => setMode('type')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'type' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}>Type</button>
            </div>

            {mode === 'draw' ? (
              <div className="mt-4">
                <div className="relative overflow-hidden rounded-xl border border-line bg-mist">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={180}
                    className="w-full touch-none"
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={moveDraw}
                    onTouchEnd={endDraw}
                  />
                </div>
                <button type="button" onClick={clearDrawing} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Eraser className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <label htmlFor="typedName" className="text-sm font-medium text-ink">Your name</label>
                <input id="typedName" type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Jordan Lee" className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 italic text-ink" style={{ fontFamily: 'Georgia, serif' }} />
              </div>
            )}

            {error && (
              <div className="mt-4">
                <StatusBanner type="error">{error}</StatusBanner>
              </div>
            )}
            {result && !error && (
              <div className="mt-4">
                <StatusBanner type="success">Done! Your signature was added.</StatusBanner>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSign}
                disabled={processing}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
              >
                {processing ? 'Signing…' : 'Sign PDF'}
              </button>
              {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
