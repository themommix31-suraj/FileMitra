import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_FILE_SIZE, createObjectURL, revokeObjectURL, validateFile } from './fileUtils'

let nextId = 1

export const revokeItemUrls = (item) => {
  revokeObjectURL(item.previewUrl)
  revokeObjectURL(item.thumbUrl)
}

/**
 * State for tools that convert several files in a batch.
 * Item shape: { id, file, previewUrl, thumbUrl, status, blob, size, error, note }
 */
export function useBatchItems({ accept, maxFiles = 30, preview = true }) {
  const [items, setItems] = useState([])
  const [notice, setNotice] = useState(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Free object URLs when leaving the page.
  useEffect(() => () => itemsRef.current.forEach(revokeItemUrls), [])

  const addFiles = useCallback(
    (files) => {
      const accepted = []
      const rejected = []
      const room = maxFiles - itemsRef.current.length
      for (const f of files) {
        const check = validateFile(f, accept, MAX_FILE_SIZE)
        if (!check.valid) rejected.push(`${f.name}: ${check.error}`)
        else if (accepted.length >= room) rejected.push(`${f.name}: limit of ${maxFiles} files reached.`)
        else {
          accepted.push({
            id: nextId++,
            file: f,
            previewUrl: preview ? createObjectURL(f) : null,
            thumbUrl: null,
            status: 'ready',
            blob: null,
            size: 0,
            error: null,
            note: null,
          })
        }
      }
      if (accepted.length) setItems((prev) => [...prev, ...accepted])
      setNotice(rejected.length ? rejected.join(' ') : null)
    },
    [accept, maxFiles, preview]
  )

  const updateItem = useCallback((id, patch) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))), [])

  const removeItem = useCallback((id) => {
    const item = itemsRef.current.find((i) => i.id === id)
    if (item) revokeItemUrls(item)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    itemsRef.current.forEach(revokeItemUrls)
    setItems([])
    setNotice(null)
  }, [])

  /** Forget previous results (e.g. after the settings changed) but keep the files. */
  const resetResults = useCallback(() => {
    itemsRef.current.forEach((i) => revokeObjectURL(i.thumbUrl))
    setItems((prev) => prev.map((i) => ({ ...i, status: 'ready', blob: null, size: 0, error: null, note: null, thumbUrl: null })))
  }, [])

  return { items, itemsRef, notice, setNotice, addFiles, updateItem, removeItem, clearAll, resetResults }
}

export { MAX_FILE_SIZE }
