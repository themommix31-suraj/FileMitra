import { useState } from 'react'
import { compareText } from '../text/diffText'

const MODES = [
  { value: 'line', label: 'Lines' },
  { value: 'word', label: 'Words' },
  { value: 'character', label: 'Characters' },
]

export default function TextDiffTool() {
  const [original, setOriginal] = useState('')
  const [changed, setChanged] = useState('')
  const [mode, setMode] = useState('line')
  const [diff, setDiff] = useState(null)

  const handleCompare = () => {
    setDiff(compareText(original, changed, mode))
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Original text</h2>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            rows={12}
            placeholder="Paste the original text here…"
            className="mt-3 w-full resize-none rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink"
          />
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Changed text</h2>
          <textarea
            value={changed}
            onChange={(e) => setChanged(e.target.value)}
            rows={12}
            placeholder="Paste the changed text here…"
            className="mt-3 w-full resize-none rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <span className="text-sm font-medium text-ink">Compare by:</span>
        <div className="flex gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m.value ? 'text-white' : 'text-ink-soft hover:bg-mist'
              }`}
              style={mode === m.value ? { background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCompare}
          disabled={!original && !changed}
          className="ml-auto inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
        >
          Compare
        </button>
      </div>

      {diff && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Result</h2>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-600">+{diff.stats.additions} added</span>
              <span className="text-rose-600">-{diff.stats.deletions} removed</span>
              <span className="text-ink-soft">{diff.stats.unchanged} unchanged</span>
            </div>
          </div>
          <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-mist p-4 font-mono text-xs leading-relaxed text-ink">
            {diff.parts.map((part, i) => (
              <span
                key={i}
                className={
                  part.added
                    ? 'rounded bg-emerald-100 text-emerald-800'
                    : part.removed
                      ? 'rounded bg-rose-100 text-rose-800 line-through decoration-1'
                      : ''
                }
              >
                {part.value}
              </span>
            ))}
          </pre>
        </div>
      )}
    </div>
  )
}
