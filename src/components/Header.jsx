import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'

const NAV = [
  { label: 'Image Tools', to: '/category/image-tools' },
  { label: 'PDF Tools', to: '/category/pdf-tools' },
  { label: 'Other Tools', to: '/category/other-tools' },
  { label: 'Blog', to: '/blog' },
  { label: 'About', to: '/about' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-sky-400))' }}
          >
            <Zap className="h-4.5 w-4.5" strokeWidth={2.5} aria-hidden="true" />
          </span>
          FileSwift
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/tools"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            All Tools
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-4 pb-4 pt-2 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-mist hover:text-ink"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link
                to="/tools"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-white"
                style={{ background: 'var(--color-brand-600)' }}
              >
                All Tools
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
