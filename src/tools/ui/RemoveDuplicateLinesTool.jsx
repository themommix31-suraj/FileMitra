import { useMemo, useState } from 'react'
import CopyButton from '../../components/CopyButton'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { SegmentedControl } from '../../components/calcParts'
import { removeDuplicateLines } from '../text/textUtils'
import { downloadBlob } from '../../utils/downloadUtils'

function Check({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand-500)]" />
      {label}
    </label>
  )
}

export default function RemoveDuplicateLinesTool() {
  const [input, setInput] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(true)
  const [trim, setTrim] = useState(false)
  const [ignoreEmpty, setIgnoreEmpty] = useState(false)
  const [sort, setSort] = useState('none')

  const result = useMemo(() => removeDuplicateLines(input, { caseSensitive, trim, ignoreEmpty, sort }), [input, caseSensitive, trim, ignoreEmpty, sort])

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Check id="dup-case" label="Case sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
          <Check id="dup-trim" label="Trim spaces around lines" checked={trim} onChange={setTrim} />
          <Check id="dup-empty" label="Remove empty lines" checked={ignoreEmpty} onChange={setIgnoreEmpty} />
        </div>
        <div className="mt-4">
          <SegmentedControl
            label="Sort the result"
            options={[
              { value: 'none', label: 'Keep original order' },
              { value: 'asc', label: 'A → Z' },
              { value: 'desc', label: 'Z → A' },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="dup-input" className="text-sm font-medium text-ink">Your lines</label>
          <textarea id="dup-input" value={input} onChange={(e) => setInput(e.target.value)} rows={14} placeholder={'apple\nbanana\napple\ncherry\nbanana'} className="mt-2 w-full resize-y rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink" />
        </div>
        <div>
          <label htmlFor="dup-output" className="text-sm font-medium text-ink">Result</label>
          <textarea id="dup-output" value={input ? result.output : ''} readOnly rows={14} className="mt-2 w-full resize-y rounded-xl border border-line bg-white p-3 font-mono text-xs text-ink" />
        </div>
      </div>

      {input && (
        <StatusBanner type="success">
          Removed {result.removed} {result.removed === 1 ? 'line' : 'lines'} · {result.kept} {result.kept === 1 ? 'line' : 'lines'} left (from {result.total}).
        </StatusBanner>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <CopyButton text={input ? result.output : ''} label="Copy result" />
        {input && <DownloadButton label="Download .txt" onClick={() => downloadBlob(new Blob([result.output], { type: 'text/plain;charset=utf-8' }), 'unique-lines.txt')} />}
      </div>
    </div>
  )
}
