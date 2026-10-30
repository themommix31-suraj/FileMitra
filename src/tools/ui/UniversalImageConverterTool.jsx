import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { convertImage, OUTPUT_FORMATS } from '../image/convertImage'
import { validateFile, formatBytes, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, downloadAsZip, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/avif']
const FORMAT_KEYS = Object.keys(OUTPUT_FORMATS)
const MAX_FILES = 30

let nextId = 1

/** Output file name with the new extension. */
function outputName(file, format) {
  return suggestOutputName(file.name, { newExt: OUTPUT_FORMATS[format].ext })
}

/** Makes names unique inside a ZIP (a.png + a.jpg -> a.webp, a-2.webp). */
function uniqueNames(items, format) {
  const seen = new Map()
  return items.map((item) => {
    const name = outputName(item.file, format)
    const count = (seen.get(name) || 0) + 1
    seen.set(name, count)
    if (count === 1) return name
    const dot = name.lastIndexOf('.')
    return `${name.slice(0, dot)}-${count}${name.slice(dot)}`
  })
}

export default function UniversalImageConverterTool() {
  const [items, setItems] = useState([]) // { id, file, previewUrl, status, blob, size, error }
  const [format, setFormat] = useState('png')
  const [quality, setQuality] = useState(85)
  const [processing, setProcessing] = useState(false)
  const [notice, setNotice] = useState(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const target = OUTPUT_FORMATS[format]
  const doneItems = items.filter((i) => i.status === 'done')
  const pendingCount = items.filter((i) => i.status !== 'done').length

  // Free preview URLs when leaving the page.
  useEffect(() => {
    return () => itemsRef.current.forEach((i) => revokeObjectURL(i.previewUrl))
  }, [])

  const updateItem = (id, patch) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const handleFiles = (files) => {
    const accepted = []
    const rejected = []
    const room = MAX_FILES - items.length
    for (const f of files) {
      const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
      if (!check.valid) rejected.push(`${f.name}: ${check.error}`)
      else if (accepted.length >= room) rejected.push(`${f.name}: limit of ${MAX_FILES} images reached.`)
      else accepted.push({ id: nextId++, file: f, previewUrl: createObjectURL(f), status: 'ready', blob: null, size: 0, error: null })
    }
    if (accepted.length) setItems((prev) => [...prev, ...accepted])
    setNotice(rejected.length ? rejected.join(' ') : null)
  }

  const resetResults = () => setItems((prev) => prev.map((i) => ({ ...i, status: 'ready', blob: null, size: 0, error: null })))

  const chooseFormat = (key) => {
    if (key === format) return
    setFormat(key)
    resetResults() // old results were for a different format
  }

  const removeItem = (id) => {
    const item = items.find((i) => i.id === id)
    if (item) revokeObjectURL(item.previewUrl)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const clearAll = () => {
    items.forEach((i) => revokeObjectURL(i.previewUrl))
    setItems([])
    setNotice(null)
  }

  const convertAll = async () => {
    setProcessing(true)
    setNotice(null)
    const toRun = itemsRef.current.filter((i) => i.status !== 'done')
    for (const item of toRun) {
      updateItem(item.id, { status: 'working', error: null })
      try {
        const blob = await convertImage(item.file, { to: format, quality: quality / 100 })
        updateItem(item.id, { status: 'done', blob, size: blob.size })
      } catch (err) {
        updateItem(item.id, { status: 'error', error: friendlyErrorMessage(err) })
      }
    }
    setProcessing(false)
  }

  const downloadOne = (item) => downloadBlob(item.blob, outputName(item.file, format))

  const downloadAll = async () => {
    const names = uniqueNames(doneItems, format)
    await downloadAsZip(
      doneItems.map((item, idx) => ({ name: names[idx], blob: item.blob })),
      `fileswift-converted-${format === 'jpeg' ? 'jpg' : format}.zip`
    )
  }

  return (
    <div className="space-y-6">
      <UploadDropzone
        accept={ACCEPT}
        acceptLabel="images (JPG, PNG, WebP, GIF, BMP, AVIF)"
        multiple
        maxSize={MAX_FILE_SIZE}
        onFiles={handleFiles}
        compact={items.length > 0}
      />

      {notice && <StatusBanner type="error">{notice}</StatusBanner>}

      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* File list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                {items.length} {items.length === 1 ? 'image' : 'images'}
              </h2>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear all
              </button>
            </div>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-mist">
                    <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
                    <p className="text-xs text-ink-soft">
                      {formatBytes(item.file.size)}
                      {item.status === 'done' && ` → ${formatBytes(item.size)} ${target.label}`}
                      {item.status === 'error' && <span className="text-rose-600"> · {item.error}</span>}
                    </p>
                  </div>
                  {item.status === 'working' && <Loader2 className="h-4 w-4 animate-spin text-ink-soft" aria-label="Converting" />}
                  {item.status === 'done' && (
                    <>
                      <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--color-mint-500)' }} aria-label="Converted" />
                      <button
                        type="button"
                        onClick={() => downloadOne(item)}
                        aria-label={`Download ${outputName(item.file, format)}`}
                        className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-mist hover:text-ink"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {item.status === 'error' && <AlertTriangle className="h-4 w-4 text-rose-500" aria-label="Failed" />}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={processing}
                    aria-label={`Remove ${item.file.name}`}
                    className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Settings */}
          <div className="h-fit rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Convert to</h2>

            <div role="radiogroup" aria-label="Output format" className="mt-3 grid grid-cols-4 gap-2">
              {FORMAT_KEYS.map((key) => {
                const active = key === format
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={processing}
                    onClick={() => chooseFormat(key)}
                    className={[
                      'rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60',
                      active ? 'border-transparent text-white shadow-sm' : 'border-line bg-white text-ink hover:bg-mist',
                    ].join(' ')}
                    style={active ? { background: 'var(--color-brand-500)' } : undefined}
                  >
                    {OUTPUT_FORMATS[key].label}
                  </button>
                )
              })}
            </div>

            {target.lossy && (
              <div className="mt-5">
                <label htmlFor="convert-quality" className="flex justify-between text-sm font-medium text-ink">
                  <span>Quality</span>
                  <span className="text-ink-soft">{quality}</span>
                </label>
                <input
                  id="convert-quality"
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={quality}
                  disabled={processing}
                  onChange={(e) => {
                    setQuality(Number(e.target.value))
                    resetResults()
                  }}
                  className="mt-2 w-full accent-[var(--color-brand-500)]"
                />
                <div className="flex justify-between text-xs text-ink-soft">
                  <span>Smaller file</span>
                  <span>Best quality</span>
                </div>
              </div>
            )}

            {!target.hasAlpha && (
              <p className="mt-4 rounded-lg bg-mist p-3 text-xs leading-relaxed text-ink-soft">
                {target.label} doesn&rsquo;t support transparency, so transparent areas will become white.
              </p>
            )}

            <ErrorSummary items={items} />

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={convertAll}
                disabled={processing || pendingCount === 0}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
              >
                {processing ? 'Converting…' : pendingCount === 0 ? 'All converted' : `Convert ${pendingCount} to ${target.label}`}
              </button>

              {doneItems.length === 1 && <DownloadButton label={`Download ${target.label}`} onClick={() => downloadOne(doneItems[0])} />}
              {doneItems.length > 1 && <DownloadButton label={`Download all (${doneItems.length}) as ZIP`} onClick={downloadAll} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ErrorSummary({ items }) {
  const failed = items.filter((i) => i.status === 'error').length
  if (!failed) return null
  return (
    <div className="mt-4">
      <StatusBanner type="error">
        {failed} {failed === 1 ? 'image' : 'images'} couldn&rsquo;t be converted. Remove {failed === 1 ? 'it' : 'them'} or try another format.
      </StatusBanner>
    </div>
  )
}
