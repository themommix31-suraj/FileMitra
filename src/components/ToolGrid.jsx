import ToolCard from './ToolCard'

export default function ToolGrid({ tools, emptyMessage = 'No tools match your search yet.' }) {
  if (tools.length === 0) {
    return <p className="py-12 text-center text-sm text-ink-soft">{emptyMessage}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  )
}
