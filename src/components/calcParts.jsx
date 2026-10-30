// Small building blocks shared by the calculator tools.

export function NumberField({ id, label, value, onChange, prefix, suffix, min, step = 'any', placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="flex items-center rounded-xl border border-line bg-mist focus-within:border-[var(--color-brand-400)]">
        {prefix && <span className="pl-3 text-sm text-ink-soft">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-ink-soft">{suffix}</span>}
      </div>
    </div>
  )
}

export function ResultBox({ label, value, strong = false, hint }) {
  return (
    <div className={`rounded-xl p-4 ${strong ? 'text-white' : 'bg-mist'}`} style={strong ? { background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' } : undefined}>
      <p className={`text-xs ${strong ? 'text-white/80' : 'text-ink-soft'}`}>{label}</p>
      <p className={`mt-0.5 font-display font-bold ${strong ? 'text-2xl' : 'text-lg text-ink'}`}>{value}</p>
      {hint && <p className={`mt-0.5 text-xs ${strong ? 'text-white/80' : 'text-ink-soft'}`}>{hint}</p>}
    </div>
  )
}

export function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={[
                'rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors',
                active ? 'border-transparent text-white shadow-sm' : 'border-line bg-white text-ink hover:bg-mist',
              ].join(' ')}
              style={active ? { background: 'var(--color-brand-500)' } : undefined}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
