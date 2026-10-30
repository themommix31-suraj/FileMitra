import { useEffect, useRef } from 'react'
import { computeCrop, drawFramed } from '../tools/image/cropMath'

/**
 * Preview of the final framing. In "crop" mode the image can be dragged (or moved with the
 * arrow keys) to choose what stays inside the frame; "fit" mode shows the whole image on white.
 */
export default function CropFrame({ source, srcW, srcH, aspect, mode = 'crop', zoom = 1, center, onCenterChange, guide = false, maxWidth = 340 }) {
  const canvasRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !source) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const cssW = canvas.clientWidth || maxWidth
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.max(1, Math.round((cssW / aspect) * dpr))
    const ctx = canvas.getContext('2d')
    drawFramed(ctx, source, srcW, srcH, { w: canvas.width, h: canvas.height, mode, zoom, cx: center.x, cy: center.y })

    if (guide) {
      const W = canvas.width
      const H = canvas.height
      ctx.save()
      ctx.lineWidth = Math.max(2, W / 150)
      ctx.setLineDash([W / 40, W / 60])
      for (const [color, offset] of [['rgba(0,0,0,0.45)', 1.5], ['rgba(255,255,255,0.95)', 0]]) {
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.ellipse(W / 2 + offset, H * 0.46 + offset, W * 0.27, H * 0.33, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(W * 0.12 + offset, H * 0.4 + offset)
        ctx.lineTo(W * 0.88 + offset, H * 0.4 + offset)
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [source, srcW, srcH, aspect, mode, zoom, center, guide, maxWidth])

  const currentCrop = () => computeCrop({ imgW: srcW, imgH: srcH, aspect, zoom, cx: center.x, cy: center.y })
  const moveTo = (x, y) => {
    const c = computeCrop({ imgW: srcW, imgH: srcH, aspect, zoom, cx: x, cy: y })
    onCenterChange({ x: (c.sx + c.sw / 2) / srcW, y: (c.sy + c.sh / 2) / srcH })
  }

  const onPointerDown = (e) => {
    if (mode !== 'crop') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const c = currentCrop()
    drag.current = { x: e.clientX, y: e.clientY, cx: c.sx + c.sw / 2, cy: c.sy + c.sh / 2 }
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const c = currentCrop()
    const perPx = c.sw / e.currentTarget.clientWidth
    moveTo((drag.current.cx - (e.clientX - drag.current.x) * perPx) / srcW, (drag.current.cy - (e.clientY - drag.current.y) * perPx) / srcH)
  }
  const onKeyDown = (e) => {
    if (mode !== 'crop') return
    const step = 0.02
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (!moves[e.key]) return
    e.preventDefault()
    moveTo(center.x + moves[e.key][0], center.y + moves[e.key][1])
  }

  return (
    <canvas
      ref={canvasRef}
      tabIndex={mode === 'crop' ? 0 : -1}
      role="img"
      aria-label={mode === 'crop' ? 'Photo frame — drag or use the arrow keys to reposition' : 'Photo preview'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => { drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
      onKeyDown={onKeyDown}
      className={`mx-auto block w-full rounded-xl border border-line bg-white shadow-sm ${mode === 'crop' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ maxWidth, aspectRatio: String(aspect), touchAction: mode === 'crop' ? 'none' : 'auto' }}
    />
  )
}
