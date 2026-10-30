import { useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function TimestampConverterTool() {
  const [timestamp, setTimestamp] = useState(String(Math.floor(Date.now() / 1000)))
  const [dateInput, setDateInput] = useState(() => toLocalInputValue(new Date()))
  const [copied, setCopied] = useState(null)

  const dateFromTimestamp = useMemo(() => {
    const n = Number(timestamp)
    if (!timestamp.trim() || Number.isNaN(n)) return null
    const ms = timestamp.trim().length > 10 ? n : n * 1000
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }, [timestamp])

  const handleNow = () => {
    const now = new Date()
    setTimestamp(String(Math.floor(now.getTime() / 1000)))
    setDateInput(toLocalInputValue(now))
  }

  const handleDateChange = (value) => {
    setDateInput(value)
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) setTimestamp(String(Math.floor(d.getTime() / 1000)))
  }

  const handleCopy = async (value) => {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 1200)
  }

  const results = dateFromTimestamp
    ? [
        { label: 'ISO 8601', value: dateFromTimestamp.toISOString() },
        { label: 'UTC', value: dateFromTimestamp.toUTCString() },
        { label: 'Local time', value: dateFromTimestamp.toString() },
      ]
    : []

  return (
    <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <label htmlFor="ts" className="text-sm font-medium text-ink">Unix timestamp</label>
          <button type="button" onClick={handleNow} className="text-xs font-semibold" style={{ color: 'var(--color-brand-600)' }}>Use now</button>
        </div>
        <input
          id="ts"
          type="text"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          placeholder="1699999999"
          className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 font-mono text-sm text-ink"
        />
        <p className="mt-2 text-xs text-ink-soft">Accepts seconds or milliseconds since epoch.</p>

        <label htmlFor="date" className="mt-4 block text-sm font-medium text-ink">Or pick a date</label>
        <input
          id="date"
          type="datetime-local"
          step="1"
          value={dateInput}
          onChange={(e) => handleDateChange(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-ink"
        />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Converted</h2>
        {results.length > 0 ? (
          <div className="mt-4 space-y-2">
            {results.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs text-ink-soft">{r.label}</p>
                  <code className="block truncate font-mono text-sm text-ink">{r.value}</code>
                </div>
                <button type="button" onClick={() => handleCopy(r.value)} aria-label={`Copy ${r.label}`} className="shrink-0 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-white">
                  {copied === r.value ? <Check className="h-4 w-4" style={{ color: 'var(--color-mint-500)' }} /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">Enter a valid timestamp or date.</p>
        )}
      </div>
    </div>
  )
}
