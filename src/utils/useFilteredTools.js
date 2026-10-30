import { useMemo, useState } from 'react'

export function useFilteredTools(sourceTools) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sourceTools
    return sourceTools.filter(
      (t) => t.name.toLowerCase().includes(q) || t.shortDescription?.toLowerCase().includes(q) || t.slug.includes(q) || t.keywords?.some((k) => k.includes(q))
    )
  }, [sourceTools, query])

  return { query, setQuery, filtered }
}
