import { useEffect, useState } from 'react'
import UploadDropzone from '../../components/UploadDropzone'
import FilePreview from '../../components/FilePreview'
import DownloadButton from '../../components/DownloadButton'
import StatusBanner from '../../components/StatusBanner'
import { NumberField, SegmentedControl } from '../../components/calcParts'
import { num } from '../calc/calculators'
import { svgToImage } from '../image/svgToPng'
import { loadSvgImage } from '../image/svgUtils'
import { validateFile, formatBytes, createObjectURL, revokeObjectURL, friendlyErrorMessage, MAX_FILE_SIZE } from '../../utils/fileUtils'
import { downloadBlob, suggestOutputName } from '../../utils/downloadUtils'

const ACCEPT = ['image/svg+xml']
const EXT = { png: '.png', jpeg: '.jpg', webp: '.webp' }
const LABEL = { png: 'PNG', jpeg: 'JPG', webp: 'WebP' }
const CHECKER = {
  backgroundImage: 'conic-gradient(#e9ebf5 25%, #fff 0 50%, #e9ebf5 0 75%, #fff 0)',
  backgroundSize: '16px 16px',
}

export default function SvgToPngTool() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dims, setDims] = useState(null)
  const [format, setFormat] = useState('png')
  const [size, setSize] = useState('2') // '1'..'4' = scale, 'custom' = width in px
  const [customWidth, setCustomWidth] = useState('1024')
  const [bg, setBg] = useState('transparent')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => () => revokeObjectURL(previewUrl), [previewUrl])
  useEffect(() => () => revokeObjectURL(result?.url), [result])

  const handleFiles = async (files) => {
    const f = files[0]
    const check = validateFile(f, ACCEPT, MAX_FILE_SIZE)
    if (!check.valid) {
      setError(check.error)
      return
    }
    try {
      const { url, width, height } = await loadSvgImage(f) // validates the SVG and reads its size
      revokeObjectURL(url)
      setDims({ width, height })
    } catch (err) {
      setError(friendlyErrorMessage(err))
      return
    }
    setError(null)
    setResult(null)
    setFile(f)
    setPreviewUrl(createObjectURL(f))
  }

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setDims(null)
    setError(null)
  }

  const background = format === 'jpeg' && bg === 'transparent' ? '#ffffff' : bg === 'transparent' ? null : bg === 'white' ? '#ffffff' : bgColor

  const run = async () => {
    const width = size === 'custom' ? Math.round(num(customWidth)) : undefined
    if (size === 'custom' && !(width >= 1)) {
      setError('Enter a width of at least 1 pixel.')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const r = await svgToImage(file, { format, scale: Number(size) || 2, width, background })
      setResult({ ...r, url: createObjectURL(r.blob) })
    } catch (err) {
      setError(friendlyErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  if (!file) {
    return (
      <div>
        <UploadDropzone accept={['image/svg+xml', '.svg']} acceptLabel="an SVG file" maxSize={MAX_FILE_SIZE} onFiles={handleFiles} />
        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
      </div>
    )
  }

  const outputPx =
    size === 'custom' ? `${Math.round(num(customWidth)) || '?'} px wide` : `${Math.round(dims.width * Number(size))} × ${Math.round(dims.height * Number(size))} px`

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl border border-line p-4" style={CHECKER}>
          <img src={result?.url || previewUrl} alt="Preview" className="mx-auto max-h-[380px] max-w-full object-contain" />
        </div>
        <ul className="mt-3">
          <FilePreview name={file.name} size={file.size} extraInfo={`${Math.round(dims.width)} × ${Math.round(dims.height)} px`} onRemove={reset} />
        </ul>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Export settings</h2>

        <div className="mt-4 space-y-5">
          <SegmentedControl
            label="Format"
            options={Object.keys(LABEL).map((k) => ({ value: k, label: LABEL[k] }))}
            value={format}
            onChange={(v) => {
              setFormat(v)
              setResult(null)
            }}
          />
          <SegmentedControl
            label="Size"
            options={[
              { value: '1', label: '1×' },
              { value: '2', label: '2×' },
              { value: '3', label: '3×' },
              { value: '4', label: '4×' },
              { value: 'custom', label: 'Custom' },
            ]}
            value={size}
            onChange={(v) => {
              setSize(v)
              setResult(null)
            }}
          />
          {size === 'custom' && (
            <NumberField id="svg-width" label="Width" value={customWidth} suffix="px" min="1" onChange={(v) => { setCustomWidth(v); setResult(null) }} />
          )}
          <p className="text-xs text-ink-soft">Output: {outputPx} (height keeps the original proportions)</p>

          <SegmentedControl
            label="Background"
            options={[
              { value: 'transparent', label: format === 'jpeg' ? 'White' : 'Transparent' },
              ...(format === 'jpeg' ? [] : [{ value: 'white', label: 'White' }]),
              { value: 'custom', label: 'Colour' },
            ]}
            value={bg}
            onChange={(v) => {
              setBg(v)
              setResult(null)
            }}
          />
          {bg === 'custom' && (
            <div className="flex items-center gap-3">
              <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setResult(null) }} aria-label="Background colour" className="h-10 w-14 cursor-pointer rounded-lg border border-line" />
              <span className="font-mono text-sm text-ink-soft">{bgColor}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}
        {result && !error && (
          <div className="mt-4">
            <StatusBanner type="success">
              Done! {result.width} × {result.height} px · {formatBytes(result.blob.size)}
            </StatusBanner>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={run}
            disabled={processing}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            {processing ? 'Converting…' : `Convert to ${LABEL[format]}`}
          </button>
          {result && <DownloadButton label={`Download ${LABEL[format]}`} onClick={() => downloadBlob(result.blob, suggestOutputName(file.name, { newExt: EXT[format] }))} />}
        </div>
      </div>
    </div>
  )
}
