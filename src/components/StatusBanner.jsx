import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function StatusBanner({ type = 'success', children }) {
  const isError = type === 'error'
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
        isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-mint-500/20 bg-mint-500/10 text-ink'
      }`}
      style={!isError ? { borderColor: 'color-mix(in srgb, var(--color-mint-500) 30%, white)', background: 'color-mix(in srgb, var(--color-mint-500) 8%, white)' } : undefined}
    >
      {isError ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-mint-500)' }} />
      )}
      <div>{children}</div>
    </div>
  )
}
