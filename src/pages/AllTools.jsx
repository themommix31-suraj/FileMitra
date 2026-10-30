import SEO from '../components/SEO'
import ToolSearch from '../components/ToolSearch'
import ToolGrid from '../components/ToolGrid'
import PromoBanner from '../components/PromoBanner'
import { tools } from '../data/tools'
import { useFilteredTools } from '../utils/useFilteredTools'

export default function AllTools() {
  const { query, setQuery, filtered } = useFilteredTools(tools)

  return (
    <>
      <SEO
        path="/tools"
        title="All Free Online File Tools"
        description="Browse every free FileSwift tool for images and PDFs — compress, convert, resize, merge and more, all in your browser."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">All Tools</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-soft">
            {tools.length} tools for images, PDFs and everyday tasks — free, and ready to use.
          </p>
          <div className="mt-6">
            <ToolSearch value={query} onChange={setQuery} />
          </div>
        </div>

        <div className="mt-4">
          <PromoBanner />
        </div>

        <div className="mt-10">
          <ToolGrid tools={filtered} />
        </div>
      </div>
    </>
  )
}
