import { useEffect, useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { imagesToPdf } from '../pdf/imagesToPdf'
import { validateFile, formatBytes, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

export default function ImagesToPdfTool({ accept = DEFAULT_ACCEPT, acceptLabel = 'images (JPG, PNG or WebP)' }) {
  const ACCEPT = accept
  const [items, setItems] = useState([]) // { file, id, previewUrl }
  const [pageSize, setPageSize] = useState('a4')
  const [orientation, setOrientation] = useState('portrait')
  const [margin, setMargin] = useState(24)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const dragIndex = useRef(null)

  useEffect(() => {
    return () => items.forEach((it) => revokeObjectURL(it.previewUrl))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFiles = (files) => {
    const accepted = []
    for (const f of files) {
      const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
      if (check.valid) {
        accepted.push({ file: f, id: `${f.name}-${f.size}-${Math.random()}`, previewUrl: createObjectURL(f) })
      } else {
        setError(check.error)
      }
    }
    if (accepted.length) {
      setError(null)
      setResult(null)
      setItems((prev) => [...prev, ...accepted])
    }
  }

  const removeItem = (id) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id)
      if (target) revokeObjectURL(target.previewUrl)
      return prev.filter((it) => it.id !== id)
    })
  }

  const onDrop = (index) => {
    if (dragIndex.current === null || dragIndex.current === index) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex.current, 1)
      next.splice(index, 0, moved)
      return next
    })
    dragIndex.current = null
  }

  const handleGenerate = async () => {
    if (items.length === 0) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await imagesToPdf(items.map((it) => it.file), { pageSize, orientation, margin: Number(margin) })
      setResult({ blob, size: blob.size, pages: items.length })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    downloadBlob(result.blob, 'fileswift-images.pdf')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel={acceptLabel} multiple maxSize={MAX_FILE_SIZE} onFiles={handleFiles} compact={items.length > 0} />

        {items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((it, index) => (
              <li
                key={it.id}
                draggable
                onDragStart={() => (dragIndex.current = index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(index)}
              >
                <FilePreview name={it.file.name} size={it.file.size} previewUrl={it.previewUrl} onRemove={() => removeItem(it.id)} draggable />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">PDF settings</h2>

        <div className="mt-4">
          <label htmlFor="pageSize" className="text-sm font-medium text-ink">Page size</label>
          <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="fit">Fit to image</option>
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="orientation" className="text-sm font-medium text-ink">Orientation</label>
          <select
            id="orientation"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
            disabled={pageSize === 'fit'}
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink disabled:opacity-50"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="margin" className="flex justify-between text-sm font-medium text-ink">
            <span>Margin</span>
            <span className="text-ink-soft">{margin}pt</span>
          </label>
          <input id="margin" type="range" min="0" max="72" step="4" value={margin} onChange={(e) => setMargin(e.target.value)} className="mt-2 w-full accent-[var(--color-brand-500)]" />
        </div>

        <div className="mt-5 rounded-xl bg-mist p-3 text-sm">
          <p className="text-ink-soft">Images added</p>
          <p className="font-semibold text-ink">{items.length}</p>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Created a {result.pages}-page PDF ({formatBytes(result.size)}).</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={processing || items.length === 0}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Generating…' : 'Generate PDF'}
          </button>
          {result && <DownloadButton label="Download PDF" onClick={handleDownload} />}
        </div>
      </div>
    </div>
  )
}
