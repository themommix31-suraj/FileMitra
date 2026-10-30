import { ArrowRight } from 'lucide-react'

/**
 * Sponsored promo banner for TheMomMix (themommix.com) — premium,
 * personalized dry fruit & nut mixes. Sits in the same ad slots as
 * <AdPlaceholder /> but renders a real, clearly-labeled "Sponsored" unit.
 * Swap or remove freely once a real ad network is wired in.
 */
export default function PromoBanner({ className = '' }) {
  return (
    <a
      href="https://www.themommix.com"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-line bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-5 sm:p-4 ${className}`}
    >
      <span className="absolute right-3 top-3 rounded-full bg-mist px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-soft/60 sm:right-4 sm:top-4">
        Sponsored
      </span>

      <img
        src="https://www.themommix.com/images/almonds.webp"
        alt="Premium dry fruits from TheMomMix"
        className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-brand-600)' }}>
          TheMomMix
        </p>
        <p className="mt-0.5 truncate font-display text-base font-bold text-ink sm:text-lg">
          The Best Dry Fruits, Personalized for Your Family
        </p>
        <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">
          Premium almonds, cashews & nut mixes — hand-sorted, FSSAI certified, delivered pan-India.
        </p>
      </div>

      <span
        className="hidden shrink-0 items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-transform group-hover:scale-[1.03] sm:flex"
        style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
      >
        Shop Now <ArrowRight className="h-4 w-4" />
      </span>
    </a>
  )
}
