import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import ToolIcon from './ToolIcon'

const CATEGORY_ACCENT = {
  'image-tools': 'var(--color-brand-500)',
  'pdf-tools': 'var(--color-sky-500)',
  'other-tools': 'var(--color-mint-500)',
}

export default function ToolCard({ tool }) {
  const accent = CATEGORY_ACCENT[tool.category] || 'var(--color-brand-500)'
  const disabled = !tool.implemented

  const content = (
    <div
      className={[
        'group relative flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm transition-all',
        disabled ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-md',
      ].join(' ')}
    >
      {tool.popular && (
        <span
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          style={{ background: accent }}
        >
          <Sparkles className="h-3 w-3" /> Popular
        </span>
      )}
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${accent} 12%, white)`, color: accent }}
      >
        <ToolIcon name={tool.icon} />
      </div>
      <h3 className="font-display text-base font-semibold text-ink">{tool.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{tool.shortDescription}</p>
      <div className="mt-4 flex items-center text-sm font-semibold" style={{ color: disabled ? 'var(--color-ink-soft)' : accent }}>
        {disabled ? 'Coming soon' : 'Use Tool'}
        {!disabled && <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
      </div>
    </div>
  )

  if (disabled) {
    return <div aria-disabled="true">{content}</div>
  }

  return (
    <Link to={`/tools/${tool.slug}`} className="block h-full">
      {content}
    </Link>
  )
}
