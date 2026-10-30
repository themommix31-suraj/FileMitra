import { useMemo, useState } from 'react'

/**
 * Live word/character counter. Both "Word Counter" and "Character Counter"
 * show the same full stat set — the mode only changes which stat is
 * emphasized up top, matching what the visitor searched for.
 * @param {{ mode: 'words'|'characters' }} props
 */
export default function TextStatsTool({ mode = 'words' }) {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const sentences = text.trim() === '' ? 0 : (text.match(/[.!?]+(?=\s|$)/g) || []).length
    const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim() !== '').length
    const readingMinutes = Math.max(1, Math.round(words / 200))
    return { words, characters, charactersNoSpaces, sentences, paragraphs, readingMinutes }
  }, [text])

  const primary = mode === 'characters'
    ? [{ label: 'Characters', value: stats.characters }, { label: 'Without spaces', value: stats.charactersNoSpaces }]
    : [{ label: 'Words', value: stats.words }, { label: 'Reading time', value: `${stats.readingMinutes} min` }]

  const secondary = mode === 'characters'
    ? [{ label: 'Words', value: stats.words }, { label: 'Sentences', value: stats.sentences }, { label: 'Paragraphs', value: stats.paragraphs }]
    : [{ label: 'Characters', value: stats.characters }, { label: 'Sentences', value: stats.sentences }, { label: 'Paragraphs', value: stats.paragraphs }]

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Your text</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Start typing or paste your text here…"
          className="mt-3 w-full resize-none rounded-xl border border-line bg-mist p-3 text-sm text-ink"
        />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Stats</h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {primary.map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-white" style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500))' }}>
              <p className="text-xs opacity-90">{s.label}</p>
              <p className="font-display text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {secondary.map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-xl bg-mist px-4 py-2.5 text-sm">
              <span className="text-ink-soft">{s.label}</span>
              <span className="font-semibold text-ink">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
