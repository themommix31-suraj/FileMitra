import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import BatchFileList from '../../components/BatchFileList'
import { useBatchItems, MAX_FILE_SIZE } from '../../utils/useBatchItems'
import { convertHeic } from '../image/heicConvert'
import { createObjectURL, revokeObjectURL, friendlyErrorMessage } from '../../utils/fileUtils'
import { downloadBlob, downloadAsZip, dedupeNames, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/heic', 'image/heif']
const ACCEPT_ATTR = [...ACCEPT, '.heic', '.heif']
const EXT = { jpeg: '.jpg', png: '.png' }
const LABEL = { jpeg: 'JPG', png: 'PNG' }

/** @param {{ toFormat?: 'jpeg'|'png' }} props */
export default function HeicConverterTool({ toFormat = 'jpeg' }) {
  // HEIC can't be previewed by most browsers, so previews come from the converted result instead.
  const batch = useBatchItems({ accept: ACCEPT, preview: false })
  const { items, itemsRef, notice, addFiles, updateItem, removeItem, clearAll } = batch
  const [quality, setQuality] = useState(92)
  const [processing, setProcessing] = useState(false)

  const label = LABEL[toFormat]
  const doneItems = items.filter((i) => i.status === 'done')
  const pendingCount = items.length - doneItems.length
  const outName = (item) => suggestOutputName(item.file.name, { newExt: EXT[toFormat] })

  const run = async () => {
    setProcessing(true)
    for (const item of itemsRef.current.filter((i) => i.status !== 'done')) {
      updateItem(item.id, { status: 'working', error: null })
      try {
        const blob = await convertHeic(item.file, { to: toFormat, quality: quality / 100 })
        revokeObjectURL(item.thumbUrl)
        updateItem(item.id, { status: 'done', blob, size: blob.size, thumbUrl: createObjectURL(blob) })
      } catch (err) {
        updateItem(item.id, { status: 'error', error: friendlyErrorMessage(err) })
      }
    }
    setProcessing(false)
  }

  const downloadAll = async () => {
    const names = dedupeNames(doneItems.map(outName))
    await downloadAsZip(doneItems.map((it, i) => ({ name: names[i], blob: it.blob })), `fileswift-heic-to-${EXT[toFormat].slice(1)}.zip`)
  }

  return (
    <div className="space-y-6">
      <UploadDropzone accept={ACCEPT_ATTR} acceptLabel="HEIC / HEIF photos" multiple maxSize={MAX_FILE_SIZE} onFiles={addFiles} compact={items.length > 0} />
      {notice && <StatusBanner type="error">{notice}</StatusBanner>}

      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                {items.length} {items.length === 1 ? 'photo' : 'photos'}
              </h2>
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-rose-500">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear all
              </button>
            </div>
            <BatchFileList items={items} disabled={processing} onRemove={removeItem} onDownload={(it) => downloadBlob(it.blob, outName(it))} outLabel={label} getOutputName={outName} />
          </div>

          <div className="h-fit rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Convert HEIC to {label}</h2>

            {toFormat === 'jpeg' && (
              <div className="mt-4">
                <label htmlFor="heic-quality" className="flex justify-between text-sm font-medium text-ink">
                  <span>Quality</span>
                  <span className="text-ink-soft">{quality}</span>
                </label>
                <input
                  id="heic-quality"
                  type="range"
                  min="40"
                  max="100"
                  value={quality}
                  disabled={processing}
                  onChange={(e) => {
                    setQuality(Number(e.target.value))
                    batch.resetResults()
                  }}
                  className="mt-2 w-full accent-[var(--color-brand-500)]"
                />
                <div className="flex justify-between text-xs text-ink-soft">
                  <span>Smaller file</span>
                  <span>Best quality</span>
                </div>
              </div>
            )}

            <p className="mt-4 rounded-lg bg-mist p-3 text-xs leading-relaxed text-ink-soft">
              The first conversion downloads the HEIC decoder (a few MB), so it can take a moment. After that it runs instantly, on your device.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={run}
                disabled={processing || pendingCount === 0}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
              >
                {processing ? 'Converting…' : pendingCount === 0 ? 'All converted' : `Convert ${pendingCount} to ${label}`}
              </button>
              {doneItems.length === 1 && <DownloadButton label={`Download ${label}`} onClick={() => downloadBlob(doneItems[0].blob, outName(doneItems[0]))} />}
              {doneItems.length > 1 && <DownloadButton label={`Download all (${doneItems.length}) as ZIP`} onClick={downloadAll} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
