import { FileText, GripVertical, X } from 'lucide-react'
import { formatBytes } from '../utils/fileUtils'

/**
 * A single file row: thumbnail/icon, name, size, optional drag handle and
 * remove button. Used across image and PDF tools.
 */
export default function FilePreview({ name, size, previewUrl, isPdf, onRemove, draggable, dragHandleProps, extraInfo }) {
  return (
    <li
      className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm"
      {...dragHandleProps}
    >
      {draggable && (
        <span className="cursor-grab text-ink-soft/60" aria-hidden="true">
          <GripVertical className="h-4 w-4" />
        </span>
      )}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-5 w-5 text-ink-soft" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{name}</p>
        <p className="text-xs text-ink-soft">
          {formatBytes(size)}
          {extraInfo ? ` · ${extraInfo}` : ''}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-500"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </li>
  )
}
