import { useEffect, useMemo, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import CropFrame from '../../components/CropFrame'
import { NumberField, SegmentedControl } from '../../components/calcParts'
import { num } from '../calc/calculators'
import { EXAM_PRESETS, EXAM_PAGES } from '../../data/photoPresets'
import { renderPhoto, cleanScan, stripHeight, todayDdMmYyyy } from '../image/photoLayout'
import { encodeJpegInRange } from '../image/jpegFit'
import { compositeOnColor, BG_MODELS } from '../image/removeBackground'
import { useCutout } from '../../utils/useCutout'
import { validateFile, loadImage, formatBytes, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const dims = (s) => ({ w: s.naturalWidth || s.width, h: s.naturalHeight || s.height })
const valsFrom = (p) => ({ w: String(p.w), h: String(p.h), minKB: String(p.minKB), maxKB: String(p.maxKB) })

/**
 * Resizes and compresses a photo or signature to the exact pixel size and KB range a form asks for.
 * @param {{ exam?: 'neet'|'jee'|'bank', startKind?: 'photo'|'signature' }} props used by the exam landing pages
 */
export default function ExamPhotoTool({ exam = 'default', startKind = 'photo' }) {
  const defaults = EXAM_PAGES[exam] || EXAM_PAGES.default
  const [kind, setKind] = useState(startKind)
  const [presetId, setPresetId] = useState(defaults[startKind])
  const [vals, setVals] = useState(() => valsFrom(EXAM_PRESETS.find((p) => p.id === defaults[startKind])))
  const [mode, setMode] = useState(startKind === 'signature' ? 'fit' : 'crop')
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 })
  const [strip, setStrip] = useState({ on: false, name: '', date: todayDdMmYyyy() })
  const [clean, setClean] = useState(true)
  const [whiten, setWhiten] = useState(false)
  const [model, setModel] = useState('fast')

  const [file, setFile] = useState(null)
  const [image, setImage] = useState(null) // { img, url }
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const resultUrl = useRef(null)
  const cutout = useCutout()

  const preset = EXAM_PRESETS.find((p) => p.id === presetId)
  const w = Math.round(num(vals.w))
  const h = Math.round(num(vals.h))
  const minKB = num(vals.minKB) || 0
  const maxKB = num(vals.maxKB) || 0
  const validSize = w >= 10 && h >= 10 && w <= 6000 && h <= 6000 && (!maxKB || minKB <= maxKB)
  const stripOn = kind === 'photo' && strip.on
  const frameH = stripOn ? h - stripHeight(h) : h

  const whitened = useMemo(() => (cutout.canvas ? compositeOnColor(cutout.canvas, '#ffffff') : null), [cutout.canvas])
  const source = whiten && whitened ? whitened : image?.img
  const { w: srcW, h: srcH } = source ? dims(source) : { w: 1, h: 1 }

  useEffect(() => () => {
    revokeObjectURL(image?.url)
    revokeObjectURL(resultUrl.current)
  }, [image])

  // Re-create the output whenever something that affects it changes.
  useEffect(() => {
    if (!source || !validSize) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const canvas = renderPhoto(source, srcW, srcH, { w, h, mode, zoom, cx: center.x, cy: center.y, strip: stripOn ? { name: strip.name, date: strip.date } : null })
        if (kind === 'signature' && clean) cleanScan(canvas)
        const r = await encodeJpegInRange(canvas, { minBytes: Math.round(minKB * 1024), maxBytes: maxKB ? Math.round(maxKB * 1024) : Infinity })
        if (cancelled) return
        revokeObjectURL(resultUrl.current)
        resultUrl.current = createObjectURL(r.blob)
        setResult({ ...r, url: resultUrl.current, w, h })
        setError(null)
      } catch (err) {
        if (!cancelled) setError(friendlyErrorMessage(err))
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source, srcW, srcH, w, h, minKB, maxKB, validSize, mode, zoom, center, stripOn, strip.name, strip.date, kind, clean])

  const applyPreset = (id) => {
    const p = EXAM_PRESETS.find((x) => x.id === id)
    setPresetId(id)
    setVals(valsFrom(p))
    setResult(null)
  }
  const changeKind = (k) => {
    setKind(k)
    applyPreset(defaults[k])
    setMode(k === 'signature' ? 'fit' : 'crop')
    setCenter({ x: 0.5, y: 0.5 })
    setZoom(1)
  }

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
      setCenter({ x: 0.5, y: 0.5 })
      setZoom(1)
      setResult(null)
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
    setResult(null)
    setWhiten(false)
    cutout.reset()
  }

  if (!file || !image) {
    return (
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="a photo or a scanned signature (JPG, PNG or WebP)" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  const inRange = result && !result.tooBig && result.blob.size >= minKB * 1024 && (!maxKB || result.blob.size <= maxKB * 1024)
  const rangeLabel = maxKB ? `${minKB ? `${minKB}–` : 'up to '}${maxKB} KB` : minKB ? `at least ${minKB} KB` : 'any size'
  const presetsForKind = EXAM_PRESETS.filter((p) => p.kind === kind)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* left: framing */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-4">
          {validSize ? (
            <CropFrame source={source} srcW={srcW} srcH={srcH} aspect={w / frameH} mode={mode} zoom={zoom} center={center} onCenterChange={setCenter} />
          ) : (
            <p className="p-6 text-center text-sm text-ink-soft">Enter a valid width and height to see the preview.</p>
          )}
          {mode === 'crop' && (
            <div className="mt-3">
              <label htmlFor="exam-zoom" className="flex justify-between text-sm font-medium text-ink">
                <span>Zoom</span>
                <span className="text-ink-soft">{zoom.toFixed(1)}×</span>
              </label>
              <input id="exam-zoom" type="range" min="1" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-brand-500)]" />
              <p className="mt-1 text-xs text-ink-soft">Drag the picture to position it.</p>
            </div>
          )}
        </div>
        <ul>
          <FilePreview name={file.name} size={file.size} previewUrl={image.url} onRemove={reset} />
        </ul>
      </div>

      {/* right: settings + result */}
      <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
        <SegmentedControl
          label="What are you resizing?"
          options={[
            { value: 'photo', label: 'Photo' },
            { value: 'signature', label: 'Signature' },
          ]}
          value={kind}
          onChange={changeKind}
        />

        <div>
          <label htmlFor="exam-preset" className="text-sm font-medium text-ink">Size required by your form</label>
          <select id="exam-preset" value={presetId} onChange={(e) => applyPreset(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink">
            {presetsForKind.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          {preset && <p className="mt-1.5 text-xs text-ink-soft">{preset.note}</p>}
          <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-ink-soft">
            Requirements change every year and websites often disagree. Compare with your exam’s official notification, and edit any value below.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField id="exam-w" label="Width" suffix="px" min="10" value={vals.w} onChange={(v) => setVals({ ...vals, w: v })} />
          <NumberField id="exam-h" label="Height" suffix="px" min="10" value={vals.h} onChange={(v) => setVals({ ...vals, h: v })} />
          <NumberField id="exam-min" label="Minimum size" suffix="KB" min="0" value={vals.minKB} onChange={(v) => setVals({ ...vals, minKB: v })} />
          <NumberField id="exam-max" label="Maximum size" suffix="KB" min="0" value={vals.maxKB} onChange={(v) => setVals({ ...vals, maxKB: v })} />
        </div>

        <SegmentedControl
          label="Framing"
          options={[
            { value: 'crop', label: 'Fill the frame' },
            { value: 'fit', label: 'Fit the whole image' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {kind === 'signature' && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand-500)]" />
            Clean up the scan (whiten the paper, darken the ink)
          </label>
        )}

        {kind === 'photo' && (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={whiten} onChange={(e) => toggleWhiten(e.target.checked)} disabled={cutout.status === 'working'} className="h-4 w-4 accent-[var(--color-brand-500)]" />
              Make the background white (AI, on your device)
            </label>
            {whiten && cutout.status !== 'working' && (
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
            {cutout.status === 'working' && <ProgressBar value={cutout.percent} label={cutout.label} />}
            {cutout.status === 'error' && <StatusBanner type="error">{cutout.error}</StatusBanner>}

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={strip.on} onChange={(e) => setStrip({ ...strip, on: e.target.checked })} className="h-4 w-4 accent-[var(--color-brand-500)]" />
              Add name and date strip at the bottom
            </label>
            {strip.on && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="strip-name" className="mb-1.5 block text-sm font-medium text-ink">Name</label>
                  <input id="strip-name" value={strip.name} onChange={(e) => setStrip({ ...strip, name: e.target.value })} placeholder="YOUR NAME" className="w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink" />
                </div>
                <div>
                  <label htmlFor="strip-date" className="mb-1.5 block text-sm font-medium text-ink">Date of photo</label>
                  <input id="strip-date" value={strip.date} onChange={(e) => setStrip({ ...strip, date: e.target.value })} className="w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-line pt-5">
          {error && <StatusBanner type="error">{error}</StatusBanner>}
          {result && !error && (
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-mist">
                  <img src={result.url} alt="Your resized image" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-ink">
                    {result.w} × {result.h} px · {formatBytes(result.blob.size)}
                  </p>
                  <p className={inRange ? 'text-emerald-700' : 'text-rose-600'}>
                    {inRange ? `✓ Within ${rangeLabel}` : result.tooBig ? `Couldn’t get under ${maxKB} KB at this size` : `Not within ${rangeLabel}`}
                  </p>
                  {result.padded && <p className="mt-1 text-xs text-ink-soft">Padded with invisible data to reach the minimum size — the picture itself is unchanged.</p>}
                </div>
              </div>
              {result.tooBig && <StatusBanner type="error">Even at the lowest quality this size is above your limit. Raise the maximum KB, or reduce the width/height if your form allows.</StatusBanner>}
              <DownloadButton label="Download JPG" onClick={() => downloadBlob(result.blob, `${kind}-${result.w}x${result.h}.jpg`)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
