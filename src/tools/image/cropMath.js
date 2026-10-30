const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/**
 * The part of an image to use when cropping to a fixed aspect ratio.
 * zoom 1 = the largest crop of that ratio that fits; higher = closer in.
 * (cx, cy) is the crop centre as a fraction of the image (0..1) — it is clamped so the crop stays inside.
 * @returns {{ sx:number, sy:number, sw:number, sh:number }}
 */
export function computeCrop({ imgW, imgH, aspect, zoom = 1, cx = 0.5, cy = 0.5 }) {
  let baseW
  let baseH
  if (imgW / imgH > aspect) {
    baseH = imgH
    baseW = imgH * aspect
  } else {
    baseW = imgW
    baseH = imgW / aspect
  }
  const sw = baseW / Math.max(1, zoom)
  const sh = baseH / Math.max(1, zoom)
  return {
    sx: clamp(cx * imgW - sw / 2, 0, imgW - sw),
    sy: clamp(cy * imgH - sh / 2, 0, imgH - sh),
    sw,
    sh,
  }
}

/** Draws the source into a w×h area of `ctx`, either cropped to fill ('crop') or whole on white ('fit'). */
export function drawFramed(ctx, source, srcW, srcH, { x = 0, y = 0, w, h, mode = 'crop', zoom = 1, cx = 0.5, cy = 0.5 }) {
  ctx.save()
  ctx.imageSmoothingQuality = 'high'
  if (mode === 'fit') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, w, h)
    const r = Math.min(w / srcW, h / srcH)
    const dw = srcW * r
    const dh = srcH * r
    ctx.drawImage(source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  } else {
    const { sx, sy, sw, sh } = computeCrop({ imgW: srcW, imgH: srcH, aspect: w / h, zoom, cx, cy })
    ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h)
  }
  ctx.restore()
}
