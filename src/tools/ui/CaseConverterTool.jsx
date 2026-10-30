import { useMemo, useState } from 'react'
import CopyButton from '../../components/CopyButton'
import DownloadButton from '../../components/DownloadButton'
import { CASES, convertCase } from '../text/textUtils'
import { downloadBlob } from '../../utils/downloadUtils'

export default function CaseConverterTool() {
  const [input, setInput] = useState('')
  const [caseId, setCaseId] = useState('title')
  const output = useMemo(() => convertCase(input, caseId), [input, caseId])
  const words = input.trim() ? input.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="case-input" className="text-sm font-medium text-ink">Your text</label>
        <textarea
          id="case-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={7}
          placeholder="Type or paste your text here…"
          className="mt-2 w-full resize-y rounded-xl border border-line bg-mist p-3 text-sm text-ink"
        />
        <p className="mt-1 text-xs text-ink-soft">{input.length} characters · {words} words</p>
      </div>

      <div role="radiogroup" aria-label="Choose a case" className="flex flex-wrap gap-2">
        {CASES.map((c) => {
          const active = c.id === caseId
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCaseId(c.id)}
              className={['rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors', active ? 'border-transparent text-white shadow-sm' : 'border-line bg-white text-ink hover:bg-mist'].join(' ')}
              style={active ? { background: 'var(--color-brand-500)' } : undefined}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      <div>
        <label htmlFor="case-output" className="text-sm font-medium text-ink">Result</label>
        <textarea id="case-output" value={output} readOnly rows={7} className="mt-2 w-full resize-y rounded-xl border border-line bg-white p-3 text-sm text-ink" />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <CopyButton text={output} label="Copy result" />
          {output && <DownloadButton label="Download .txt" onClick={() => downloadBlob(new Blob([output], { type: 'text/plain;charset=utf-8' }), 'converted-text.txt')} />}
          {output && (
            <button type="button" onClick={() => setInput(output)} className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-mist">
              Use result as input
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
