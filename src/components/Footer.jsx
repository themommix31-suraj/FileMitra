import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Tools',
    links: [
      { label: 'Image Tools', to: '/category/image-tools' },
      { label: 'PDF Tools', to: '/category/pdf-tools' },
      { label: 'Other Tools', to: '/category/other-tools' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Cookie Policy', to: '/cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-mist">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-sky-400))' }}
              >
                <Zap className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              </span>
              FileSwift
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Free, browser-based file, image and PDF tools. No signup, no uploads to a server unless a tool
              truly requires it.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-ink-soft transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row">
          <p>© 2026 FileSwift. Free online file tools.</p>
          <p>Built with your privacy in mind — most tools never leave your browser.</p>
        </div>
      </div>
    </footer>
  )
}
