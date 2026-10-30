import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import CopyButton from '../../components/CopyButton'
import { SegmentedControl } from '../../components/calcParts'
import { generateFavicons, FAVICON_HTML, WEB_MANIFEST } from '../image/faviconGenerator'
import { validateFile, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, downloadAsZip } from '../../utils/downloadUtils'

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const ACCEPT_ATTR = [...ACCEPT, '.svg']
const CHECKER = {
  backgroundImage: 'conic-gradient(#e9ebf5 25%, #fff 0 50%, #e9ebf5 0 75%, #fff 0)',
  backgroundSize: '12px 12px',
}

export default function FaviconGeneratorTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [mode, setMode] = useState('fit')
  const [bg, setBg] = useState('transparent')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [result, setResult] = useState(null) // { ico, pngs, urls }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const resultRef = useRef(null)

  const freeResult = () => resultRef.current?.urls.forEach(revokeObjectURL)
  useEffect(() => () => { revokeObjectURL(previewUrl) }, [previewUrl])
  useEffect(() => () => freeResult(), [])

  // Regenerate automatically whenever the image or an option changes.
  useEffect(() => {
    if (!file) return undefined
    let cancelled = false
    generateFavicons(file, { mode, background: bg === 'color' ? bgColor : null })
      .then((r) => {
        if (cancelled) return
        freeResult()
        const next = { ...r, urls: r.pngs.map((p) => createObjectURL(p.blob)) }
        resultRef.current = next
        setResult(next)
        setError(null)
      })
      .catch((err) => !cancelled && setError(friendlyErrorMessage(err)))
      .finally(() => !cancelled && setBusy(false))
    return () => {
      cancelled = true
    }
  }, [file, mode, bg, bgColor])

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setBusy(true)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const reset = () => {
    freeResult()
    resultRef.current = null
    setResult(null)
    setFile(null)
    setPreviewUrl(null)
    setError(null)
  }

  const downloadZip = () =>
    downloadAsZip(
      [
        { name: 'favicon.ico', blob: result.ico },
        ...result.pngs.map((p) => ({ name: p.name, blob: p.blob })),
        { name: 'site.webmanifest', blob: new Blob([WEB_MANIFEST], { type: 'application/manifest+json' }) },
      ],
      'favicons.zip'
    )

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT_ATTR} acceptLabel="a logo or image (PNG, JPG, WebP or SVG)" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <ul>
          <FilePreview name={file.name} size={file.size} previewUrl={previewUrl} onRemove={reset} />
        </ul>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Options</h2>
          <div className="mt-4 space-y-5">
            <SegmentedControl
              label="Make it square by"
              options={[
                { value: 'fit', label: 'Fitting the whole image' },
                { value: 'crop', label: 'Cropping the centre' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <SegmentedControl
              label="Background"
              options={[
                { value: 'transparent', label: 'Transparent' },
                { value: 'color', label: 'Colour' },
              ]}
              value={bg}
              onChange={setBg}
            />
            {bg === 'color' && (
              <div className="flex items-center gap-3">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} aria-label="Background colour" className="h-10 w-14 cursor-pointer rounded-lg border border-line" />
                <span className="font-mono text-sm text-ink-soft">{bgColor}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Your favicons</h2>
        {error && (
          <div className="mt-3">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {busy && !result && <p className="mt-3 text-sm text-ink-soft">Generating…</p>}

        {result && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {result.pngs.map((p, i) => (
                <div key={p.name} className="text-center">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line" style={CHECKER}>
                    <img src={result.urls[i]} alt={`${p.size}px icon`} style={{ width: Math.min(p.size, 64), height: Math.min(p.size, 64) }} />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft">{p.size}px</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <DownloadButton label="Download all (ZIP)" onClick={downloadZip} />
              <button
                type="button"
                onClick={() => downloadBlob(result.ico, 'favicon.ico')}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-mist"
              >
                favicon.ico only
              </button>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Add this to your site&rsquo;s &lt;head&gt;</h3>
                <CopyButton text={FAVICON_HTML} label="Copy code" />
              </div>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-mist p-3 text-xs leading-relaxed text-ink">{FAVICON_HTML}</pre>
              <p className="mt-2 text-xs text-ink-soft">Upload the files to the root folder of your website (next to index.html).</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
