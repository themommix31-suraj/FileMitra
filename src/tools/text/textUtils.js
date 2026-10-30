/* ---------------- case conversion ---------------- */

/** Splits text into words, understanding camelCase, snake_case, kebab-case and spaces. */
function splitWords(text) {
  return text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

const capitalize = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w)

export const CASES = [
  { id: 'upper', label: 'UPPER CASE', fn: (t) => t.toUpperCase() },
  { id: 'lower', label: 'lower case', fn: (t) => t.toLowerCase() },
  {
    id: 'title',
    label: 'Title Case',
    fn: (t) => t.toLowerCase().replace(/(^|[\s\-–—("“[/])(\p{L})/gu, (_, pre, ch) => pre + ch.toUpperCase()),
  },
  {
    id: 'sentence',
    label: 'Sentence case',
    fn: (t) =>
      t.toLowerCase().replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (_, pre, ch) => pre + ch.toUpperCase()),
  },
  {
    id: 'camel',
    label: 'camelCase',
    fn: (t) => splitWords(t).map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w))).join(''),
  },
  { id: 'pascal', label: 'PascalCase', fn: (t) => splitWords(t).map(capitalize).join('') },
  { id: 'snake', label: 'snake_case', fn: (t) => splitWords(t).map((w) => w.toLowerCase()).join('_') },
  { id: 'kebab', label: 'kebab-case', fn: (t) => splitWords(t).map((w) => w.toLowerCase()).join('-') },
  { id: 'constant', label: 'CONSTANT_CASE', fn: (t) => splitWords(t).map((w) => w.toUpperCase()).join('_') },
  {
    id: 'alternating',
    label: 'aLtErNaTiNg cAsE',
    fn: (t) => {
      let i = 0
      return Array.from(t, (ch) => (/\p{L}/u.test(ch) ? (i++ % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()) : ch)).join('')
    },
  },
  {
    id: 'inverse',
    label: 'iNVERSE cASE',
    fn: (t) => Array.from(t, (ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join(''),
  },
]

export const convertCase = (text, id) => (CASES.find((c) => c.id === id)?.fn ?? ((t) => t))(text)

/* ---------------- duplicate lines ---------------- */

/**
 * @param {string} text
 * @param {{ caseSensitive?: boolean, trim?: boolean, ignoreEmpty?: boolean, sort?: 'none'|'asc'|'desc' }} options
 */
export function removeDuplicateLines(text, { caseSensitive = true, trim = false, ignoreEmpty = false, sort = 'none' } = {}) {
  const lines = text.split(/\r?\n/)
  const seen = new Set()
  const kept = []
  let removed = 0
  for (const original of lines) {
    const line = trim ? original.trim() : original
    if (ignoreEmpty && line.trim() === '') {
      removed += 1
      continue
    }
    const key = caseSensitive ? line : line.toLowerCase()
    if (seen.has(key)) {
      removed += 1
      continue
    }
    seen.add(key)
    kept.push(line)
  }
  if (sort !== 'none') {
    kept.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
    if (sort === 'desc') kept.reverse()
  }
  return { output: kept.join('\n'), total: lines.length, kept: kept.length, removed }
}
