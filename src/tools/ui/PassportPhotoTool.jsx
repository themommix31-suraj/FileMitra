import { useEffect, useMemo, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import CropFrame from '../../components/CropFrame'
import { NumberField, SegmentedControl } from '../../components/calcParts'
import { num } from '../calc/calculators'
import { PASSPORT_PRESETS } from '../../data/photoPresets'
import { renderPhoto, buildSheet, sheetToPdf, mmToPx, PAPERS } from '../image/photoLayout'
import { compositeOnColor, canvasToBlob, BG_MODELS } from '../image/removeBackground'
import { useCutout } from '../../utils/useCutout'
import { validateFile, loadImage, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const BACKGROUNDS = [
  { value: '#ffffff', label: 'White' },
  { value: '#e6e6e6', label: 'Light grey' },
  { value: '#cfe3f8', label: 'Light blue' },
]
const dims = (s) => ({ w: s.naturalWidth || s.width, h: s.naturalHeight || s.height })

/** @param {{ presetId?: string }} props lets a landing page start on a specific size */
export default function PassportPhotoTool({ presetId: initialPreset = '35x45' }) {
  const [presetId, setPresetId] = useState(initialPreset)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: 0.5, y: 0.4 })
  const [whiten, setWhiten] = useState(false)
  const [model, setModel] = useState('quality')
  const [bg, setBg] = useState('#ffffff')
  const [paper, setPaper] = useState('4x6')
  const [copies, setCopies] = useState('')
  const [file, setFile] = useState(null)
  const [image, setImage] = useState(null)
  const [out, setOut] = useState(null)
  const [error, setError] = useState(null)
  const urls = useRef({})
  const cutout = useCutout()

  const preset = PASSPORT_PRESETS.find((p) => p.id === presetId)
  const pxW = mmToPx(preset.wMM)
  const pxH = mmToPx(preset.hMM)

  const cut = useMemo(() => (cutout.canvas ? compositeOnColor(cutout.canvas, bg) : null), [cutout.canvas, bg])
  const source = whiten && cut ? cut : image?.img
  const { w: srcW, h: srcH } = source ? dims(source) : { w: 1, h: 1 }

  useEffect(() => () => {
    revokeObjectURL(image?.url)
    Object.values(urls.current).forEach(revokeObjectURL)
  }, [image])

  useEffect(() => {
    if (!source) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const photo = renderPhoto(source, srcW, srcH, { w: pxW, h: pxH, mode: 'crop', zoom, cx: center.x, cy: center.y, strip: null })
        const sheet = buildSheet(photo, { paper, photoW: preset.wMM, photoH: preset.hMM, copies: Math.round(num(copies)) || 0 })
        const [photoBlob, sheetBlob] = await Promise.all([canvasToBlob(photo, 'image/jpeg', 0.95), canvasToBlob(sheet.canvas, 'image/jpeg', 0.95)])
        if (cancelled) return
        Object.values(urls.current).forEach(revokeObjectURL)
        urls.current = { photo: createObjectURL(photoBlob), sheet: createObjectURL(sheetBlob) }
        setOut({ photoBlob, sheetBlob, sheet, photoUrl: urls.current.photo, sheetUrl: urls.current.sheet })
        setError(null)
      } catch (err) {
        if (!cancelled) setError(friendlyErrorMessage(err))
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source, srcW, srcH, pxW, pxH, zoom, center, paper, copies, preset.wMM, preset.hMM])

  const handleFiles = async (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    try {
      const loaded = await loadImage(f)
      setImage(loaded)
      setFile(f)
      setCenter({ x: 0.5, y: 0.4 })
      setZoom(1)
      setOut(null)
      setError(null)
      setWhiten(false)
      cutout.reset()
    } catch (err) {
      setError(friendlyErrorMessage(err))
    }
  }

  const toggleWhiten = (on) => {
    setWhiten(on)
    if (on && !cutout.canvas && cutout.status !== 'working') cutout.run(file, model)
  }

  const reset = () => {
    setFile(null)
    setImage(null)
    setOut(null)
    setWhiten(false)
    cutout.reset()
  }

  const downloadPdf = async () => {
    try {
      downloadBlob(await sheetToPdf(out.sheet.canvas, out.sheet.paperW, out.sheet.paperH), `passport-photos-${paper}.pdf`)
    } catch (err) {
      setError(friendlyErrorMessage(err))
    }
  }

  if (!file || !image) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="a portrait photo (JPG, PNG or WebP)" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-ink-soft">Tip: take the photo facing a window, with your face straight to the camera and a plain wall behind you.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-4">
            <CropFrame source={source} srcW={srcW} srcH={srcH} aspect={pxW / pxH} zoom={zoom} center={center} onCenterChange={setCenter} guide />
            <div className="mt-3">
              <label htmlFor="pp-zoom" className="flex justify-between text-sm font-medium text-ink">
                <span>Zoom</span>
                <span className="text-ink-soft">{zoom.toFixed(1)}×</span>
              </label>
              <input id="pp-zoom" type="range" min="1" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-brand-500)]" />
              <p className="mt-1 text-xs text-ink-soft">Drag the photo so your face sits inside the oval, with your eyes near the dashed line. The guide is a rough aid only.</p>
            </div>
          </div>
          <ul>
            <FilePreview name={file.name} size={file.size} previewUrl={image.url} onRemove={reset} />
          </ul>
        </div>

        <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
          <div>
            <label htmlFor="pp-size" className="text-sm font-medium text-ink">Photo size</label>
            <select id="pp-size" value={presetId} onChange={(e) => { setPresetId(e.target.value); setOut(null) }} className="mt-1.5 w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink">
              {PASSPORT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-soft">Common for: {preset.note}. Output is {pxW} × {pxH} px (300 DPI).</p>
            <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-ink-soft">
              Rules for head size, expression and background differ by country and change over time. Check the official requirements before you print.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={whiten} onChange={(e) => toggleWhiten(e.target.checked)} disabled={cutout.status === 'working'} className="h-4 w-4 accent-[var(--color-brand-500)]" />
              Replace the background (AI, on your device)
            </label>
            {whiten && (
              <>
                <SegmentedControl label="Background colour" options={BACKGROUNDS} value={bg} onChange={setBg} />
                {cutout.status !== 'working' && (
                  <SegmentedControl
                    label="Cut-out quality (try Best quality if edges look rough)"
                    options={Object.values(BG_MODELS).map((m) => ({ value: m.id, label: `${m.label} · ${m.sizeMB} MB` }))}
                    value={model}
                    onChange={(m) => {
                      setModel(m)
                      cutout.run(file, m)
                    }}
                  />
                )}
              </>
            )}
            {cutout.status === 'working' && <ProgressBar value={cutout.percent} label={cutout.label} />}
            {cutout.status === 'error' && <StatusBanner type="error">{cutout.error}</StatusBanner>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pp-paper" className="mb-1.5 block text-sm font-medium text-ink">Print sheet</label>
              <select id="pp-paper" value={paper} onChange={(e) => setPaper(e.target.value)} className="w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink">
                {Object.entries(PAPERS).map(([id, p]) => (
                  <option key={id} value={id}>{p.label}</option>
                ))}
              </select>
            </div>
            <NumberField id="pp-copies" label="Copies" min="1" value={copies} placeholder={out ? `max ${out.sheet.capacity}` : 'fill sheet'} onChange={setCopies} />
          </div>
          {error && <StatusBanner type="error">{error}</StatusBanner>}
        </div>
      </div>

      {out && (
        <div className="grid gap-6 rounded-2xl border border-line bg-white p-5 md:grid-cols-[auto_1fr]">
          <div className="text-center">
            <img src={out.photoUrl} alt="Your passport photo" className="mx-auto h-48 rounded-lg border border-line object-contain" />
            <p className="mt-2 text-xs text-ink-soft">{pxW} × {pxH} px</p>
            <div className="mt-3">
              <DownloadButton label="Download photo" onClick={() => downloadBlob(out.photoBlob, `passport-photo-${preset.id}.jpg`)} />
            </div>
          </div>
          <div>
            <img src={out.sheetUrl} alt="Print sheet preview" className="mx-auto max-h-72 rounded-lg border border-line object-contain" />
            <p className="mt-2 text-center text-xs text-ink-soft">
              {out.sheet.count} photo{out.sheet.count === 1 ? '' : 's'} on {PAPERS[paper].label}
              {out.sheet.count < out.sheet.capacity ? ` (room for ${out.sheet.capacity})` : ''} · print at 100% / “actual size”, no scaling
            </p>
            <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
              <DownloadButton label="Download sheet (JPG)" onClick={() => downloadBlob(out.sheetBlob, `passport-photos-${paper}.jpg`)} />
              <DownloadButton label="Download sheet (PDF)" onClick={downloadPdf} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
