import { Download } from 'lucide-react'

export default function DownloadButton({ label = 'Download', onClick, size = 'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-sm transition-transform active:scale-[0.98]',
        size === 'lg' ? 'px-6 py-3.5 text-base' : 'px-5 py-2.5 text-sm',
      ].join(' ')}
      style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}
