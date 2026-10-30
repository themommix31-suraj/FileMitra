import { useCallback, useState } from 'react'
import { getCutoutCanvas, BG_MODELS } from '../tools/image/removeBackground'
import { friendlyErrorMessage } from './fileUtils'

/** Runs the on-device background removal and tracks its progress for a tool's UI. */
export function useCutout() {
  const [state, setState] = useState({ status: 'idle', canvas: null, error: null, percent: 0, label: '' })

  const run = useCallback(async (input, model = 'quality') => {
    setState({ status: 'working', canvas: null, error: null, percent: 0, label: 'Starting…' })
    try {
      const canvas = await getCutoutCanvas(input, {
        model,
        onProgress: ({ stage, percent }) =>
          setState((s) => ({
            ...s,
            percent: stage === 'run' ? 100 : percent,
            label: stage === 'download' ? `Downloading the AI model (${BG_MODELS[model].sizeMB} MB, first time only)…` : stage === 'prepare' ? 'Starting the AI model…' : 'Cutting out the subject…',
          })),
      })
      setState({ status: 'done', canvas, error: null, percent: 100, label: '' })
      return canvas
    } catch (err) {
      setState({ status: 'error', canvas: null, percent: 0, label: '', error: err?.code === 'MODEL_MISSING' ? err.message : friendlyErrorMessage(err) })
      return null
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle', canvas: null, error: null, percent: 0, label: '' }), [])
  return { ...state, run, reset }
}
