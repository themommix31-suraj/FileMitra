import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SEO from '../components/SEO'
import { blogPosts } from '../data/blogPosts'

export default function Blog() {
  return (
    <>
      <SEO
        path="/blog"
        title="FileSwift Blog — Tips for Images & PDFs"
        description="Practical guides on compressing images, converting formats, and working with PDFs."
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">FileSwift Blog</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">Short, practical guides for working with images and PDFs.</p>

        <div className="mt-10 space-y-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink">{post.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{post.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--color-brand-600)' }}>
                Read more <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
