import { useEffect, useRef, useState } from 'react'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { downloadBlob } from '../../utils/downloadUtils'

const FORMATS = ['CODE128', 'EAN13', 'UPC', 'CODE39']

export default function BarcodeGeneratorTool() {
  const [text, setText] = useState('123456789012')
  const [format, setFormat] = useState('CODE128')
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    if (!text.trim()) return
    import('jsbarcode').then((mod) => {
      if (cancelled || !canvasRef.current) return
      const JsBarcode = mod.default
      try {
        JsBarcode(canvasRef.current, text, {
          format,
          width: 2,
          height: 100,
          displayValue: true,
          background: '#ffffff',
          lineColor: '#0f172a',
        })
        setError(null)
      } catch {
        setError(`This text isn\u2019t valid for the ${format} format.`)
      }
    })
    return () => {
      cancelled = true
    }
  }, [text, format])

  const handleDownload = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'fileswift-barcode.png')
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-line bg-white p-5">
        <label htmlFor="barcodeText" className="text-sm font-medium text-ink">Text or number</label>
        <input
          id="barcodeText"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="123456789012"
          className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 font-mono text-sm text-ink"
        />

        <div className="mt-4">
          <label htmlFor="format" className="text-sm font-medium text-ink">Barcode format</label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Preview</h2>
        <div className="mt-4 flex min-h-[180px] items-center justify-center overflow-x-auto rounded-xl border border-dashed border-line bg-mist p-4">
          <canvas ref={canvasRef} />
        </div>
        <div className="mt-4">
          <DownloadButton label="Download PNG" onClick={handleDownload} />
        </div>
      </div>
    </div>
  )
}
