import { useCallback, useId, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { formatBytes } from '../utils/fileUtils'

/**
 * Accessible drag-and-drop upload area with file picker, multi-file and
 * clipboard-paste support.
 */
export default function UploadDropzone({
  accept = [],
  acceptLabel = 'files',
  multiple = false,
  maxSize,
  onFiles,
  compact = false,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)
  const inputId = useId()

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || [])
      if (files.length === 0) return
      onFiles(multiple ? files : [files[0]])
    },
    [multiple, onFiles]
  )

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const onPaste = useCallback(
    (e) => {
      if (!e.clipboardData?.files?.length) return
      handleFiles(e.clipboardData.files)
    },
    [handleFiles]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Upload ${acceptLabel}. Drag and drop, click to choose a file, or paste from clipboard.`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      className={[
        'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors',
        compact ? 'p-6' : 'p-10 sm:p-14',
        isDragging ? 'border-brand-500 bg-brand-50' : 'border-line bg-mist hover:border-brand-400 hover:bg-brand-50/40',
      ].join(' ')}
      style={{ borderColor: isDragging ? 'var(--color-brand-500)' : undefined }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple={multiple}
        accept={accept.join(',')}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div
        className={[
          'mb-4 flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-line transition-transform group-hover:scale-105',
          compact ? 'h-11 w-11' : 'h-16 w-16',
        ].join(' ')}
      >
        <UploadCloud className={compact ? 'h-5 w-5' : 'h-7 w-7'} style={{ color: 'var(--color-brand-500)' }} aria-hidden="true" />
      </div>
      <p className={`font-display font-semibold text-ink ${compact ? 'text-base' : 'text-xl'}`}>
        Drop your {acceptLabel} here
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        or <span className="font-medium underline" style={{ color: 'var(--color-brand-600)' }}>click to choose a file</span>
        {multiple ? ' — you can select several' : ''}
      </p>
      <p className="mt-3 text-xs text-ink-soft/80">
        Accepted: {acceptLabel} {maxSize ? `· up to ${formatBytes(maxSize)}` : ''} · files never leave your device
      </p>
    </div>
  )
}
