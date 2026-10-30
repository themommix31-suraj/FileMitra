import { Search } from 'lucide-react'

export default function ToolSearch({ value, onChange, placeholder = 'Search tools like Compress Image, JPG to PDF…' }) {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
      <label htmlFor="tool-search" className="sr-only">
        Search for a tool
      </label>
      <input
        id="tool-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-line bg-white py-3.5 pl-12 pr-4 text-sm text-ink shadow-sm outline-none transition-shadow placeholder:text-ink-soft/70 focus:shadow-md"
        style={{ '--tw-ring-color': 'var(--color-brand-400)' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand-400)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '')}
      />
    </div>
  )
}
