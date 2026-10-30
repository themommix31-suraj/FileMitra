export default function ProgressBar({ value, label }) {
  return (
    <div className="w-full" role="status" aria-live="polite">
      <div className="mb-1.5 flex items-center justify-between text-xs text-ink-soft">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-fog">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: 'linear-gradient(90deg, var(--color-brand-500), var(--color-sky-400))' }}
        />
      </div>
    </div>
  )
}
