// Pure text transform functions used by the JSON/Base64/URL/CSV utility tools.
// Each throws a descriptive Error on invalid input rather than failing silently.

export function formatJson(input) {
  try {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed, null, 2)
  } catch {
    throw new Error('That doesn\u2019t look like valid JSON. Check for missing quotes, commas or brackets.')
  }
}

export function minifyJson(input) {
  try {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
  } catch {
    throw new Error('That doesn\u2019t look like valid JSON. Check for missing quotes, commas or brackets.')
  }
}

function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function jsonToCsv(input) {
  let data
  try {
    data = JSON.parse(input)
  } catch {
    throw new Error('That doesn\u2019t look like valid JSON.')
  }
  if (!Array.isArray(data)) {
    throw new Error('JSON to CSV expects a JSON array of objects, e.g. [{"a":1},{"a":2}].')
  }
  if (data.length === 0) return ''

  const columns = Array.from(data.reduce((set, row) => {
    if (row && typeof row === 'object') Object.keys(row).forEach((k) => set.add(k))
    return set
  }, new Set()))

  const header = columns.map(csvEscape).join(',')
  const rows = data.map((row) => columns.map((col) => csvEscape(row?.[col])).join(','))
  return [header, ...rows].join('\n')
}

function parseCsvLine(line) {
  const cells = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      cells.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells
}

export function csvToJson(input) {
  const lines = input.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '')
  if (lines.length === 0) throw new Error('Paste some CSV data first.')

  const header = parseCsvLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    const obj = {}
    header.forEach((col, i) => (obj[col] = cells[i] ?? ''))
    return obj
  })
  return JSON.stringify(rows, null, 2)
}

export function encodeBase64Text(input) {
  try {
    return btoa(unescape(encodeURIComponent(input)))
  } catch {
    throw new Error('Could not encode this text.')
  }
}

export function decodeBase64Text(input) {
  try {
    return decodeURIComponent(escape(atob(input.trim())))
  } catch {
    throw new Error('That doesn\u2019t look like valid Base64 text.')
  }
}

export function encodeUrlText(input) {
  return encodeURIComponent(input)
}

export function decodeUrlText(input) {
  try {
    return decodeURIComponent(input)
  } catch {
    throw new Error('That doesn\u2019t look like a valid URL-encoded string.')
  }
}
