import { Link } from 'react-router-dom'
import { Check, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import SEO from '../components/SEO'
import ToolSearch from '../components/ToolSearch'
import ToolGrid from '../components/ToolGrid'
import PromoBanner from '../components/PromoBanner'
import { tools, toolsByCategory, popularTools } from '../data/tools'
import { categories } from '../data/categories'
import { useFilteredTools } from '../utils/useFilteredTools'

const TRUST = ['Free to use', 'No registration', 'Browser-based processing', 'Your files stay private']

export default function Home() {
  const { query, setQuery, filtered } = useFilteredTools(tools)
  const showingSearch = query.trim().length > 0

  return (
    <>
      <SEO
        path="/"
        title="FileSwift — Free Online File & Image Tools"
        description="Compress, convert, resize and manage images and PDFs directly in your browser. No signup, no installation, no hidden fees."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'FileSwift',
          url: 'https://filesw.app/',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://filesw.app/tools?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-mist to-white">
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
          <span
            className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink-soft shadow-sm"
          >
            <Zap className="h-3.5 w-3.5" style={{ color: 'var(--color-brand-500)' }} />
            Everything runs in your browser
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
            Free Online File{' '}
            <span className="swift-underline">& Image Tools</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Compress, convert, resize and manage your images and PDFs directly in your browser. No signup.
            No installation. No hidden fees.
          </p>

          <div className="mt-8">
            <ToolSearch value={query} onChange={setQuery} />
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              Explore All Tools <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/tools/compress-image"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-mist"
            >
              Compress an Image
            </Link>
          </div>

          <ul className="mx-auto mt-9 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4" style={{ color: 'var(--color-mint-500)' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <PromoBanner />
      </div>

      {/* SEARCH RESULTS OR CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {showingSearch ? (
          <>
            <h2 className="font-display text-2xl font-bold text-ink">Search results</h2>
            <p className="mt-1 text-sm text-ink-soft">{filtered.length} tool{filtered.length === 1 ? '' : 's'} found</p>
            <div className="mt-6">
              <ToolGrid tools={filtered} />
            </div>
          </>
        ) : (
          <div className="space-y-16">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-ink">Popular tools</h2>
              </div>
              <ToolGrid tools={popularTools} />
            </div>

            {categories.map((cat) => {
              const meta = cat
              const catTools = toolsByCategory(cat.slug).slice(0, 6)
              return (
                <div key={cat.slug}>
                  <div className="mb-6 flex items-end justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-ink">{meta.name}</h2>
                      <p className="mt-1 text-sm text-ink-soft">{meta.description}</p>
                    </div>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="hidden shrink-0 items-center gap-1 text-sm font-semibold sm:flex"
                      style={{ color: 'var(--color-brand-600)' }}
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <ToolGrid tools={catTools} />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* PRIVACY */}
      <section className="border-t border-line bg-mist">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--color-mint-500) 12%, white)' }}
          >
            <ShieldCheck className="h-7 w-7" style={{ color: 'var(--color-mint-500)' }} />
          </div>
          <h2 className="font-display text-3xl font-bold text-ink">Your Files Stay Private</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Wherever possible, FileSwift processes your files directly in your browser using open web
            standards. Your files are not uploaded to our servers or stored permanently — they're gone the
            moment you close the tab.
          </p>
          <Link
            to="/privacy"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: 'var(--color-brand-600)' }}
          >
            Read our privacy approach <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
