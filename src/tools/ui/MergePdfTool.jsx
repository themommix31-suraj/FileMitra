import { useRef, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { mergePdfs } from '../pdf/mergePdf'
import { validateFile, formatBytes, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob } from '../../utils/downloadUtils'

const ACCEPT = ['application/pdf']

export default function MergePdfTool() {
  const [items, setItems] = useState([]) // { file, id }
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const dragIndex = useRef(null)

  const handleFiles = (files) => {
    const accepted = []
    for (const f of files) {
      const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
      if (check.valid) accepted.push({ file: f, id: `${f.name}-${f.size}-${Math.random()}` })
      else setError(check.error)
    }
    if (accepted.length) {
      setError(null)
      setResult(null)
      setItems((prev) => [...prev, ...accepted])
    }
  }

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id))

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

  const handleMerge = async () => {
    if (items.length < 2) return
    setProcessing(true)
    setError(null)
    try {
      const blob = await mergePdfs(items.map((it) => it.file))
      setResult({ blob, size: blob.size })
    } catch (err) {
      setError(err.message || friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    downloadBlob(result.blob, 'fileswift-merged.pdf')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <UploadDropzone accept={ACCEPT} acceptLabel="PDF files" multiple maxSize={MAX_FILE_SIZE} onFiles={handleFiles} compact={items.length > 0} />
        {items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((it, index) => (
              <li key={it.id} draggable onDragStart={() => (dragIndex.current = index)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(index)}>
                <FilePreview name={it.file.name} size={it.file.size} onRemove={() => removeItem(it.id)} draggable />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Merge settings</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Drag files on the left to set the order they'll appear in the merged PDF.
        </p>

        <div className="mt-5 rounded-xl bg-mist p-3 text-sm">
          <p className="text-ink-soft">PDFs added</p>
          <p className="font-semibold text-ink">{items.length}</p>
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">Done! Merged {items.length} files into one PDF ({formatBytes(result.size)}).</StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleMerge}
            disabled={processing || items.length < 2}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Merging…' : 'Merge PDF'}
          </button>
          {result && <DownloadButton label="Download Merged PDF" onClick={handleDownload} />}
        </div>
        {items.length === 1 && <p className="mt-3 text-xs text-ink-soft">Add at least one more PDF to merge.</p>}
      </div>
    </div>
  )
}
