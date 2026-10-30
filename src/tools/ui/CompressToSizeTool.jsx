import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import UploadDropzone from '../../components/UploadDropzone'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import BatchFileList from '../../components/BatchFileList'
import { NumberField, SegmentedControl } from '../../components/calcParts'
import { num } from '../calc/calculators'
import { useBatchItems, MAX_FILE_SIZE } from '../../utils/useBatchItems'
import { compressToTargetSize } from '../image/compressToSize'
import { friendlyErrorMessage } from '../../utils/fileUtils'
import { downloadBlob, downloadAsZip, dedupeNames, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const PRESETS = [20, 50, 100, 200, 500, 1024]
const EXT = { jpeg: '.jpg', webp: '.webp' }
const kbLabel = (kb) => (kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`)

/**
 * @param {{ presetKB?: number }} props presetKB pre-selects a target (used by the
 *   "Compress image to 20KB / 50KB / …" landing pages)
 */
export default function CompressToSizeTool({ presetKB }) {
  const batch = useBatchItems({ accept: ACCEPT })
  const { items, itemsRef, notice, addFiles, updateItem, removeItem, clearAll, resetResults } = batch
  const [targetKB, setTargetKB] = useState(presetKB || 100)
  const [custom, setCustom] = useState('')
  const [format, setFormat] = useState('jpeg')
  const [processing, setProcessing] = useState(false)

  const doneItems = items.filter((i) => i.status === 'done')
  const pendingCount = items.length - doneItems.length
  const validTarget = Number.isFinite(targetKB) && targetKB >= 1
  const outName = (item) => suggestOutputName(item.file.name, { suffix: `-${kbLabel(targetKB).replace(' ', '').toLowerCase()}`, newExt: EXT[format] })

  const changeTarget = (kb) => {
    setTargetKB(kb)
    resetResults()
  }

  const run = async () => {
    if (!validTarget) return
    setProcessing(true)
    for (const item of itemsRef.current.filter((i) => i.status !== 'done')) {
      updateItem(item.id, { status: 'working', error: null })
      try {
        const r = await compressToTargetSize(item.file, { targetBytes: Math.floor(targetKB * 1024), format })
        const note = r.unchanged ? 'already under the target, kept as is' : r.scaled ? `resized to ${r.width}×${r.height}px` : `quality ${Math.round(r.quality * 100)}%`
        updateItem(item.id, { status: 'done', blob: r.blob, size: r.blob.size, note })
      } catch (err) {
        const knownMessage = /target size|too small|at least 1 KB/i.test(err?.message || '')
        updateItem(item.id, { status: 'error', error: knownMessage ? err.message : friendlyErrorMessage(err) })
      }
    }
    setProcessing(false)
  }

  const downloadAll = async () => {
    const names = dedupeNames(doneItems.map(outName))
    await downloadAsZip(doneItems.map((it, i) => ({ name: names[i], blob: it.blob })), `fileswift-compressed-${kbLabel(targetKB).replace(' ', '').toLowerCase()}.zip`)
  }

  return (
    <div className="space-y-6">
      <UploadDropzone accept={ACCEPT} acceptLabel="images (JPG, PNG or WebP)" multiple maxSize={MAX_FILE_SIZE} onFiles={addFiles} compact={items.length > 0} />
      {notice && <StatusBanner type="error">{notice}</StatusBanner>}

      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                {items.length} {items.length === 1 ? 'image' : 'images'}
              </h2>
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-rose-500">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear all
              </button>
            </div>
            <BatchFileList items={items} disabled={processing} onRemove={removeItem} onDownload={(it) => downloadBlob(it.blob, outName(it))} getOutputName={outName} />
          </div>

          <div className="h-fit rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Target size</h2>
            <p className="mt-1 text-xs text-ink-soft">Each image is compressed to the closest size under this limit.</p>

            <div className="mt-3">
              <SegmentedControl
                options={PRESETS.map((kb) => ({ value: kb, label: kbLabel(kb) }))}
                value={PRESETS.includes(targetKB) && !custom ? targetKB : null}
                onChange={(kb) => {
                  setCustom('')
                  changeTarget(kb)
                }}
              />
            </div>
            <div className="mt-3">
              <NumberField
                id="custom-kb"
                label="Or enter a custom size"
                value={custom}
                suffix="KB"
                min="1"
                placeholder="e.g. 75"
                onChange={(v) => {
                  setCustom(v)
                  const n = num(v)
                  if (Number.isFinite(n) && n > 0) changeTarget(n)
                }}
              />
            </div>

            <div className="mt-4">
              <SegmentedControl
                label="Output format"
                options={[
                  { value: 'jpeg', label: 'JPG' },
                  { value: 'webp', label: 'WebP' },
                ]}
                value={format}
                onChange={(f) => {
                  setFormat(f)
                  resetResults()
                }}
              />
              <p className="mt-2 text-xs text-ink-soft">JPG works on every form and portal. Transparent areas become white.</p>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={run}
                disabled={processing || pendingCount === 0 || !validTarget}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
              >
                {processing ? 'Compressing…' : pendingCount === 0 ? 'All compressed' : `Compress to ${validTarget ? kbLabel(targetKB) : '…'}`}
              </button>
              {doneItems.length === 1 && <DownloadButton label="Download image" onClick={() => downloadBlob(doneItems[0].blob, outName(doneItems[0]))} />}
              {doneItems.length > 1 && <DownloadButton label={`Download all (${doneItems.length}) as ZIP`} onClick={downloadAll} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
