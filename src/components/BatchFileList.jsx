import { AlertTriangle, CheckCircle2, Download, FileImage, Loader2, X } from 'lucide-react'
import { formatBytes } from '../utils/fileUtils'

/**
 * Status list for tools that process several files at once.
 * Each item: { id, file, previewUrl?, thumbUrl?, status: 'ready'|'working'|'done'|'error', size, error, note }
 */
export default function BatchFileList({ items, disabled, onRemove, onDownload, outLabel = '', getOutputName }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const thumb = item.thumbUrl || item.previewUrl
        return (
          <li key={item.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <FileImage className="h-5 w-5 text-ink-soft" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
              <p className="text-xs text-ink-soft">
                {formatBytes(item.file.size)}
                {item.status === 'done' && ` → ${formatBytes(item.size)}${outLabel ? ` ${outLabel}` : ''}`}
                {item.status === 'done' && item.note && ` · ${item.note}`}
                {item.status === 'error' && <span className="text-rose-600"> · {item.error}</span>}
              </p>
            </div>
            {item.status === 'working' && <Loader2 className="h-4 w-4 animate-spin text-ink-soft" aria-label="Working" />}
            {item.status === 'done' && (
              <>
                <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--color-mint-500)' }} aria-label="Done" />
                <button
                  type="button"
                  onClick={() => onDownload(item)}
                  aria-label={`Download ${getOutputName ? getOutputName(item) : item.file.name}`}
                  className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-mist hover:text-ink"
                >
                  <Download className="h-4 w-4" />
                </button>
              </>
            )}
            {item.status === 'error' && <AlertTriangle className="h-4 w-4 text-rose-500" aria-label="Failed" />}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              aria-label={`Remove ${item.file.name}`}
              className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
