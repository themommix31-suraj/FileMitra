import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import ToolGrid from '../components/ToolGrid'
import { getCategory } from '../data/categories'
import { toolsByCategory } from '../data/tools'
import NotFound from './NotFound'

export default function CategoryPage() {
  const { categorySlug } = useParams()
  const category = getCategory(categorySlug)

  if (!category) return <NotFound />

  const catTools = toolsByCategory(categorySlug)

  return (
    <>
      <SEO
        path={`/category/${categorySlug}`}
        title={`${category.name} — Free Online Tools`}
        description={category.description}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-4 text-xs text-ink-soft" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ink">Home</Link> <span className="mx-1">/</span> {category.name}
        </nav>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{category.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">{category.description}</p>

        <div className="mt-10">
          <ToolGrid tools={catTools} />
        </div>
      </div>
    </>
  )
}
