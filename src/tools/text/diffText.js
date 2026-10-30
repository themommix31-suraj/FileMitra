import { diffLines, diffWords, diffChars } from 'diff'

const DIFFERS = { line: diffLines, word: diffWords, character: diffChars }

/**
 * Computes a diff between two strings entirely on-device.
 * @param {string} oldText
 * @param {string} newText
 * @param {'line'|'word'|'character'} mode
 * @returns {{ parts: import('diff').Change[], stats: { additions: number, deletions: number, unchanged: number } }}
 */
export function compareText(oldText, newText, mode = 'line') {
  const differ = DIFFERS[mode] || diffLines
  const parts = differ(oldText ?? '', newText ?? '')

  const stats = parts.reduce(
    (acc, part) => {
      if (part.added) acc.additions += part.count || 0
      else if (part.removed) acc.deletions += part.count || 0
      else acc.unchanged += part.count || 0
      return acc
    },
    { additions: 0, deletions: 0, unchanged: 0 }
  )

  return { parts, stats }
}
