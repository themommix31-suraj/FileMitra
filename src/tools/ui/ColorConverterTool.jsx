import { useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import StatusBanner from '../../components/StatusBanner'
import { parseColor, rgbToHex, rgbToHsl } from '../text/colorConverter'

export default function ColorConverterTool() {
  const [input, setInput] = useState('#3366ff')
  const [copied, setCopied] = useState(null)

  const { rgb, error } = useMemo(() => {
    try {
      return { rgb: parseColor(input), error: null }
    } catch (err) {
      return { rgb: null, error: err.message }
    }
  }, [input])

  const hex = rgb ? rgbToHex(rgb) : null
  const hsl = rgb ? rgbToHsl(rgb) : null

  const formats = rgb
    ? [
        { label: 'HEX', value: hex },
        { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
        { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
      ]
    : []

  const handleCopy = async (value) => {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-line bg-white p-5">
        <label htmlFor="colorInput" className="text-sm font-medium text-ink">Enter a color</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="colorInput"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#3366ff, rgb(51,102,255), hsl(220,100%,60%)"
            className="flex-1 rounded-xl border border-line bg-mist px-3 py-2.5 font-mono text-sm text-ink"
          />
          <div className="h-11 w-11 shrink-0 rounded-xl border border-line" style={{ background: hex || '#fff' }} />
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        {rgb && (
          <div className="mt-5 space-y-2">
            {formats.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-4 py-2.5">
                <div>
                  <p className="text-xs text-ink-soft">{f.label}</p>
                  <code className="font-mono text-sm text-ink">{f.value}</code>
                </div>
                <button type="button" onClick={() => handleCopy(f.value)} aria-label={`Copy ${f.label}`} className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-white">
                  {copied === f.value ? <Check className="h-4 w-4" style={{ color: 'var(--color-mint-500)' }} /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
