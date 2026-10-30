import { useParams, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SEO, { SITE_URL } from '../components/SEO'
import { getPost } from '../data/blogPosts'
import { getTool } from '../data/tools'
import NotFound from './NotFound'

export default function BlogPost() {
  const { postSlug } = useParams()
  const post = getPost(postSlug)
  if (!post) return <NotFound />

  const relatedTool = post.relatedTool ? getTool(post.relatedTool) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: { '@type': 'Organization', name: 'FileSwift' },
  }

  return (
    <>
      <SEO path={`/blog/${post.slug}`} title={post.title} description={post.excerpt} jsonLd={jsonLd} />
      <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-4 text-xs text-ink-soft" aria-label="Breadcrumb">
          <Link to="/blog" className="hover:text-ink">Blog</Link> <span className="mx-1">/</span> {post.title}
        </nav>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
          {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">{post.title}</h1>

        <div className="prose prose-sm mt-8 max-w-none space-y-4 text-[15px] leading-relaxed text-ink-soft">
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {relatedTool && (
          <div className="mt-10 rounded-2xl border border-line bg-mist p-6 text-center">
            <p className="font-display text-base font-semibold text-ink">Try it yourself</p>
            <p className="mt-1 text-sm text-ink-soft">Use {relatedTool.name} free, right in your browser.</p>
            <Link
              to={`/tools/${relatedTool.slug}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
            >
              Open {relatedTool.name} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </article>
    </>
  )
}
