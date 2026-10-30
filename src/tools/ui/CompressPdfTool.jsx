import { useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import ProgressBar from '../../components/ProgressBar'
import { NumberField, SegmentedControl } from '../../components/calcParts'
import { compressPdf, compressPdfToSize } from '../pdf/compressPdf'
import { num } from '../calc/calculators'
import { validateFile, formatBytes, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'
import { percentSaved } from '../../utils/formatUtils'

const ACCEPT = ['application/pdf']
const LEVELS = [
  { value: 'low', label: 'Low', hint: 'Best quality, smaller savings' },
  { value: 'medium', label: 'Medium', hint: 'Balanced — recommended' },
  { value: 'high', label: 'High', hint: 'Smallest file, lower quality' },
]
const TARGETS = [100, 200, 300, 500, 1024]
const kbLabel = (kb) => (kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`)

/** @param {{ presetKB?: number }} props presetKB opens the tool in "target size" mode (used by the "Compress PDF to 200KB" pages) */
export default function CompressPdfTool({ presetKB }) {
  const [file, setFile] = useState(null)
  const [goal, setGoal] = useState(presetKB ? 'target' : 'level')
  const [mode, setMode] = useState('smart')
  const [level, setLevel] = useState('medium')
  const [targetKB, setTargetKB] = useState(presetKB || 200)
  const [custom, setCustom] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, label: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFiles = (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    setError(null)
    setResult(null)
    setFile(f)
  }

  const handleCompress = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setResult(null)
    setProgress({ percent: 0, label: 'Starting…' })
    const onProgress = (percent, label) => setProgress({ percent, label })
    try {
      const r =
        goal === 'target'
          ? await compressPdfToSize(file, Math.floor(targetKB * 1024), { onProgress })
          : await compressPdf(file, { mode, level, onProgress })
      setResult({ ...r, size: r.blob.size })
    } catch (err) {
      setError(/password|encrypt/i.test(err?.message || '') ? 'This PDF is password-protected. Please unlock it first.' : friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const targetValid = Number.isFinite(targetKB) && targetKB >= 10
  const flattened = result?.method === 'flattened'

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <FilePreview name={file.name} size={file.size} onRemove={() => { setFile(null); setResult(null) }} />
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          By default only the photos and scans inside your PDF are compressed, so text stays selectable and searchable. If a target size can&rsquo;t be reached that way, pages may be converted to images — you&rsquo;ll be told when that happens.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
        <SegmentedControl
          label="How do you want to compress?"
          options={[
            { value: 'level', label: 'Choose a level' },
            { value: 'target', label: 'Reach a target size' },
          ]}
          value={goal}
          onChange={(g) => { setGoal(g); setResult(null) }}
        />

        {goal === 'level' ? (
          <>
            <div className="space-y-2">
              {LEVELS.map((l) => (
                <label key={l.value} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition-colors ${level === l.value ? 'border-[var(--color-brand-500)] bg-brand-50' : 'border-line'}`}>
                  <span>
                    <span className="block font-medium text-ink">{l.label}</span>
                    <span className="block text-xs text-ink-soft">{l.hint}</span>
                  </span>
                  <input type="radio" name="level" checked={level === l.value} onChange={() => { setLevel(l.value); setResult(null) }} className="accent-[var(--color-brand-500)]" />
                </label>
              ))}
            </div>
            <SegmentedControl
              label="Method"
              options={[
                { value: 'smart', label: 'Keep text selectable' },
                { value: 'maximum', label: 'Maximum (flatten pages)' },
              ]}
              value={mode}
              onChange={(m) => { setMode(m); setResult(null) }}
            />
          </>
        ) : (
          <div className="space-y-3">
            <SegmentedControl
              label="Make it smaller than"
              options={TARGETS.map((kb) => ({ value: kb, label: kbLabel(kb) }))}
              value={TARGETS.includes(targetKB) && !custom ? targetKB : null}
              onChange={(kb) => { setCustom(''); setTargetKB(kb); setResult(null) }}
            />
            <NumberField id="pdf-custom-kb" label="Or a custom size" suffix="KB" min="10" value={custom} placeholder="e.g. 250" onChange={(v) => { setCustom(v); const n = num(v); if (Number.isFinite(n) && n > 0) { setTargetKB(n); setResult(null) } }} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-mist p-3 text-sm">
          <div>
            <p className="text-ink-soft">Original size</p>
            <p className="font-semibold text-ink">{formatBytes(file.size)}</p>
          </div>
          <div>
            <p className="text-ink-soft">New size</p>
            <p className="font-semibold text-ink">{result ? formatBytes(result.size) : '—'}</p>
          </div>
        </div>

        {processing && <ProgressBar value={progress.percent} label={progress.label} />}
        {error && <StatusBanner type="error">{error}</StatusBanner>}
        {result && !error && (
          <StatusBanner type={result.improved && result.reached ? 'success' : 'error'}>
            {!result.improved
              ? result.note
              : result.reached
                ? `Done! ${percentSaved(file.size, result.size)}% smaller${goal === 'target' ? ` — under ${kbLabel(targetKB)}` : ''}.${flattened ? ' Pages were converted to images, so the text is no longer selectable.' : ' Text is still selectable.'}`
                : `Got it down to ${formatBytes(result.size)}, but not under ${kbLabel(targetKB)}. This is the smallest this PDF can get here.${flattened ? ' Pages were converted to images.' : ''}`}
          </StatusBanner>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCompress}
            disabled={processing || (goal === 'target' && !targetValid)}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Compressing…' : goal === 'target' && targetValid ? `Compress to under ${kbLabel(targetKB)}` : 'Compress PDF'}
          </button>
          {result?.improved && <DownloadButton label="Download PDF" onClick={() => downloadBlob(result.blob, suggestOutputName(file.name, { suffix: '-compressed' }))} />}
        </div>
      </div>
    </div>
  )
}
