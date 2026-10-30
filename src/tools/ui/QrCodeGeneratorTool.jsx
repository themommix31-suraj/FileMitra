import { useEffect, useRef, useState } from 'react'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { downloadBlob } from '../../utils/downloadUtils'

export default function QrCodeGeneratorTool() {
  const [text, setText] = useState('https://')
  const [size, setSize] = useState(300)
  const [fgColor, setFgColor] = useState('#0f172a')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    if (!text.trim()) {
      setError(null)
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      return
    }
    import('qrcode').then((QRCode) => {
      if (cancelled || !canvasRef.current) return
      QRCode.toCanvas(canvasRef.current, text, { width: size, margin: 2, color: { dark: fgColor, light: bgColor } }, (err) => {
        setError(err ? 'Could not generate a QR code for this text.' : null)
      })
    })
    return () => {
      cancelled = true
    }
  }, [text, size, fgColor, bgColor])

  const handleDownload = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'fileswift-qr-code.png')
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-line bg-white p-5">
        <label htmlFor="qrText" className="text-sm font-medium text-ink">Text or URL</label>
        <textarea
          id="qrText"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="https://example.com"
          className="mt-2 w-full resize-none rounded-xl border border-line bg-mist p-3 text-sm text-ink"
        />

        <div className="mt-4">
          <label htmlFor="size" className="flex justify-between text-sm font-medium text-ink">
            <span>Size</span>
            <span className="text-ink-soft">{size}px</span>
          </label>
          <input id="size" type="range" min="150" max="600" step="10" value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-brand-500)]" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fgColor" className="text-sm font-medium text-ink">Foreground</label>
            <input id="fgColor" type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-mist" />
          </div>
          <div>
            <label htmlFor="bgColor" className="text-sm font-medium text-ink">Background</label>
            <input id="bgColor" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-mist" />
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Preview</h2>
        <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-line bg-mist p-4">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
        <div className="mt-4">
          <DownloadButton label="Download PNG" onClick={handleDownload} />
        </div>
      </div>
    </div>
  )
}
