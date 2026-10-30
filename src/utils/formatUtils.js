export function percentSaved(originalSize, newSize) {
  if (!originalSize) return 0
  const saved = ((originalSize - newSize) / originalSize) * 100
  return Math.max(0, Math.round(saved))
}

export function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
