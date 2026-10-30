/**
 * Clearly-marked placeholder for a future Google AdSense unit. Renders
 * nothing misleading — just a labeled reserved slot — so layout won't shift
 * once real ads are wired in. Swap the inner comment for your AdSense
 * <ins> tag when you're ready to monetize.
 */
export default function AdPlaceholder({ slot = 'content', className = '' }) {
  const sizes = {
    top: 'h-24',
    tool: 'h-24',
    content: 'h-32',
    footer: 'h-24',
  }

  return (
    <div
      className={`w-full rounded-xl border border-dashed border-line bg-mist/60 ${sizes[slot] || 'h-24'} flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-ink-soft/60">
        Ad space · {slot}
      </span>
      {/* Replace this div's contents with your AdSense <ins> unit once approved. */}
    </div>
  )
}
