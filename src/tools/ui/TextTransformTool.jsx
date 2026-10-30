import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import StatusBanner from '../../components/StatusBanner'
import {
  formatJson, minifyJson, jsonToCsv, csvToJson,
  encodeBase64Text, decodeBase64Text, encodeUrlText, decodeUrlText,
} from '../text/transforms'

const CONFIG = {
  'json-format': { title: 'JSON Formatter', action: 'Format JSON', inLabel: 'JSON input', outLabel: 'Formatted JSON', placeholder: '{"name":"FileSwift","tools":43}', fn: formatJson },
  'json-minify': { title: 'JSON Minifier', action: 'Minify JSON', inLabel: 'JSON input', outLabel: 'Minified JSON', placeholder: '{\n  "name": "FileSwift"\n}', fn: minifyJson },
  'json-to-csv': { title: 'JSON to CSV', action: 'Convert to CSV', inLabel: 'JSON array', outLabel: 'CSV output', placeholder: '[{"name":"Ava","age":29},{"name":"Sam","age":34}]', fn: jsonToCsv },
  'csv-to-json': { title: 'CSV to JSON', action: 'Convert to JSON', inLabel: 'CSV input', outLabel: 'JSON output', placeholder: 'name,age\nAva,29\nSam,34', fn: csvToJson },
  'base64-encode': { title: 'Base64 Encoder', action: 'Encode', inLabel: 'Plain text', outLabel: 'Base64 output', placeholder: 'Hello, world!', fn: encodeBase64Text },
  'base64-decode': { title: 'Base64 Decoder', action: 'Decode', inLabel: 'Base64 input', outLabel: 'Decoded text', placeholder: 'SGVsbG8sIHdvcmxkIQ==', fn: decodeBase64Text },
  'url-encode': { title: 'URL Encoder', action: 'Encode', inLabel: 'Plain text', outLabel: 'URL-encoded output', placeholder: 'https://example.com/search?q=hello world', fn: encodeUrlText },
  'url-decode': { title: 'URL Decoder', action: 'Decode', inLabel: 'URL-encoded input', outLabel: 'Decoded text', placeholder: 'hello%20world', fn: decodeUrlText },
}

/**
 * Generic input-textarea -> transform -> output-textarea tool, shared by
 * the JSON, Base64 and URL utility tools (only the transform function and
 * copy differ between them).
 * @param {{ mode: keyof typeof CONFIG }} props
 */
export default function TextTransformTool({ mode }) {
  const cfg = CONFIG[mode]
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleRun = () => {
    setError(null)
    try {
      setOutput(cfg.fn(input))
    } catch (err) {
      setOutput('')
      setError(err.message)
    }
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">{cfg.inLabel}</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={12}
          placeholder={cfg.placeholder}
          className="mt-3 w-full resize-none rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink"
        />
        <button
          type="button"
          onClick={handleRun}
          disabled={!input.trim()}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
        >
          {cfg.action}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">{cfg.outLabel}</h2>

        {error && (
          <div className="mt-3">
            <StatusBanner type="error">{error}</StatusBanner>
          </div>
        )}

        <textarea
          readOnly
          value={output}
          rows={12}
          placeholder="Result will appear here…"
          className="mt-3 w-full resize-none rounded-xl border border-line bg-mist p-3 font-mono text-xs text-ink"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!output}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-mist px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white disabled:opacity-60"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
      </div>
    </div>
  )
}
