import { useEffect, useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import StatusBanner from '../../components/StatusBanner'
import { generatePassword } from '../text/generators'

function strengthOf(pw, { lower, upper, digits, symbols }) {
  const variety = [lower, upper, digits, symbols].filter(Boolean).length
  const score = pw.length * variety
  if (score >= 80) return { label: 'Strong', color: '#16a34a' }
  if (score >= 40) return { label: 'Good', color: '#d97706' }
  return { label: 'Weak', color: '#dc2626' }
}

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16)
  const [lower, setLower] = useState(true)
  const [upper, setUpper] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(false)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const options = { length, lower, upper, digits, symbols, excludeAmbiguous }

  const generate = () => {
    try {
      setError(null)
      setPassword(generatePassword(options))
    } catch (err) {
      setError(err.message)
      setPassword('')
    }
  }

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, lower, upper, digits, symbols, excludeAmbiguous])

  const handleCopy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const strength = password ? strengthOf(password, options) : null

  const CheckboxRow = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between rounded-xl bg-mist px-4 py-2.5 text-sm">
      <span className="text-ink">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand-500)]" />
    </label>
  )

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-2 rounded-xl bg-mist p-4">
          <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-base font-semibold text-ink">{password || '—'}</code>
          <button type="button" onClick={generate} aria-label="Generate a new password" className="rounded-full p-2 text-ink-soft transition-colors hover:bg-white">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleCopy} aria-label="Copy password" className="rounded-full p-2 text-ink-soft transition-colors hover:bg-white">
            {copied ? <Check className="h-4 w-4" style={{ color: 'var(--color-mint-500)' }} /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        {strength && (
          <p className="mt-2 text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</p>
        )}

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="length" className="flex justify-between text-sm font-medium text-ink">
            <span>Length</span>
            <span className="text-ink-soft">{length} characters</span>
          </label>
          <input
            id="length"
            type="range"
            min="6"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-brand-500)]"
          />
        </div>

        <div className="mt-4 space-y-2">
          <CheckboxRow checked={lower} onChange={setLower} label="Lowercase letters (a-z)" />
          <CheckboxRow checked={upper} onChange={setUpper} label="Uppercase letters (A-Z)" />
          <CheckboxRow checked={digits} onChange={setDigits} label="Digits (0-9)" />
          <CheckboxRow checked={symbols} onChange={setSymbols} label="Symbols (!@#$…)" />
          <CheckboxRow checked={excludeAmbiguous} onChange={setExcludeAmbiguous} label="Exclude ambiguous characters (Il1O0)" />
        </div>

        <button
          type="button"
          onClick={generate}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
        >
          <RefreshCw className="h-4 w-4" /> Generate New Password
        </button>
      </div>
    </div>
  )
}
