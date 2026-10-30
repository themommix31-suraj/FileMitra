import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { generateUuid } from '../text/generators'

export default function UuidGeneratorTool() {
  const [count, setCount] = useState(5)
  const [uuids, setUuids] = useState(() => Array.from({ length: 5 }, generateUuid))
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const regenerate = (n = count) => setUuids(Array.from({ length: n }, generateUuid))

  const handleCopyOne = async (uuid, index) => {
    await navigator.clipboard.writeText(uuid)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1200)
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="count" className="flex justify-between text-sm font-medium text-ink">
              <span>How many?</span>
              <span className="text-ink-soft">{count}</span>
            </label>
            <input
              id="count"
              type="range"
              min="1"
              max="50"
              value={count}
              onChange={(e) => { const n = Number(e.target.value); setCount(n); regenerate(n) }}
              className="mt-2 w-full accent-[var(--color-brand-500)]"
            />
          </div>
          <button
            type="button"
            onClick={() => regenerate()}
            className="mb-0.5 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            <RefreshCw className="h-4 w-4" /> New
          </button>
        </div>

        <ul className="mt-5 max-h-80 space-y-2 overflow-y-auto">
          {uuids.map((uuid, i) => (
            <li key={`${uuid}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-4 py-2.5">
              <code className="truncate font-mono text-sm text-ink">{uuid}</code>
              <button type="button" onClick={() => handleCopyOne(uuid, i)} aria-label="Copy" className="shrink-0 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-white">
                {copiedIndex === i ? <Check className="h-4 w-4" style={{ color: 'var(--color-mint-500)' }} /> : <Copy className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleCopyAll}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-mist px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
        >
          {copiedAll ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedAll ? 'Copied!' : 'Copy all'}
        </button>
      </div>
    </div>
  )
}
