import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function NotFound() {
  return (
    <>
      <SEO path="/404" title="Page Not Found" description="This page doesn't exist on FileSwift." />
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="font-display text-6xl font-bold" style={{ color: 'var(--color-brand-500)' }}>404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">We couldn't find that page</h1>
        <p className="mt-2 text-sm text-ink-soft">
          The page you're looking for may have moved. Try one of our tools instead.
        </p>
        <Link
          to="/tools"
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
        >
          Browse All Tools
        </Link>
      </div>
    </>
  )
}
