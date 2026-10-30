import { drawFramed } from './cropMath'

export const mmToPx = (mm, dpi = 300) => Math.round((mm / 25.4) * dpi)

/** Today as dd/mm/yyyy (the format most exam portals expect on a photo strip). */
export function todayDdMmYyyy() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function fitText(ctx, text, maxWidth, startSize, bold = true) {
  let size = startSize
  do {
    ctx.font = `${bold ? '700 ' : ''}${size}px Arial, Helvetica, sans-serif`
    if (ctx.measureText(text).width <= maxWidth || size <= 6) break
    size -= 1
  } while (size > 6)
  return size
}

/** Height of the name/date strip for a photo of height h (shared so the crop frame can match it). */
export const stripHeight = (h) => Math.max(12, Math.round(h * 0.16))

/**
 * Renders a framed photo into a new canvas, optionally with a white strip at the bottom
 * carrying the candidate's name and the photo date (required by some exams).
 */
export function renderPhoto(source, srcW, srcH, { w, h, mode, zoom, cx, cy, strip }) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  const stripH = strip ? stripHeight(h) : 0
  drawFramed(ctx, source, srcW, srcH, { x: 0, y: 0, w, h: h - stripH, mode, zoom, cx, cy })

  if (strip) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, h - stripH, w, stripH)
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const name = (strip.name || '').toUpperCase()
    const date = strip.date || ''
    const lineH = stripH / 2
    const size = Math.min(fitText(ctx, name || ' ', w - 8, Math.floor(lineH * 0.85)), fitText(ctx, date || ' ', w - 8, Math.floor(lineH * 0.85)))
    ctx.font = `700 ${size}px Arial, Helvetica, sans-serif`
    ctx.fillText(name, w / 2, h - stripH + lineH * 0.5)
    ctx.fillText(date, w / 2, h - stripH + lineH * 1.5)
  }
  return canvas
}

/** Whitens the paper of a scanned signature and boosts contrast (keeps ink colour). */
export function cleanScan(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  const hist = new Uint32Array(256)
  for (let i = 0; i < d.length; i += 4) hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++
  const total = d.length / 4
  const percentile = (p) => {
    let acc = 0
    for (let v = 0; v < 256; v++) {
      acc += hist[v]
      if (acc >= total * p) return v
    }
    return 255
  }
  const white = Math.max(percentile(0.6), 60) // paper is the bright majority
  const black = Math.min(percentile(0.02), white - 20)
  const span = Math.max(1, white - black)
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, Math.max(0, ((d[i + c] - black) / span) * 255))
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

export const PAPERS = {
  '4x6': { label: '4 × 6 in (postcard)', w: 101.6, h: 152.4 },
  '5x7': { label: '5 × 7 in', w: 127, h: 177.8 },
  a4: { label: 'A4', w: 210, h: 297 },
}

/** How many photos fit, trying both paper orientations. */
export function planSheet({ paperW, paperH, photoW, photoH, gap = 2, margin = 3 }) {
  const fit = (pw, ph) => {
    const cols = Math.max(0, Math.floor((pw - 2 * margin + gap) / (photoW + gap)))
    const rows = Math.max(0, Math.floor((ph - 2 * margin + gap) / (photoH + gap)))
    return { cols, rows, pw, ph, count: cols * rows }
  }
  const portrait = fit(paperW, paperH)
  const landscape = fit(paperH, paperW)
  return landscape.count > portrait.count ? landscape : portrait
}

/** Lays out copies of a photo on a sheet of paper (300 DPI) with thin cutting guides. */
export function buildSheet(photoCanvas, { paper, photoW, photoH, copies, gap = 2, margin = 3, dpi = 300 }) {
  const { w: paperW, h: paperH } = PAPERS[paper]
  const plan = planSheet({ paperW, paperH, photoW, photoH, gap, margin })
  const count = Math.min(plan.count, copies > 0 ? copies : plan.count)
  const canvas = document.createElement('canvas')
  canvas.width = mmToPx(plan.pw, dpi)
  canvas.height = mmToPx(plan.ph, dpi)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const pw = mmToPx(photoW, dpi)
  const ph = mmToPx(photoH, dpi)
  const g = mmToPx(gap, dpi)
  const gridW = plan.cols * pw + (plan.cols - 1) * g
  const gridH = plan.rows * ph + (plan.rows - 1) * g
  const x0 = Math.round((canvas.width - gridW) / 2)
  const y0 = Math.round((canvas.height - gridH) / 2)
  ctx.imageSmoothingQuality = 'high'
  ctx.strokeStyle = '#b8b8b8'
  ctx.lineWidth = Math.max(1, Math.round(dpi / 150))
  for (let i = 0; i < count; i++) {
    const x = x0 + (i % plan.cols) * (pw + g)
    const y = y0 + Math.floor(i / plan.cols) * (ph + g)
    ctx.drawImage(photoCanvas, x, y, pw, ph)
    ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1)
  }
  return { canvas, count, capacity: plan.count, cols: plan.cols, rows: plan.rows, paperW: plan.pw, paperH: plan.ph }
}

/** One-page PDF of the sheet at its true paper size. */
export async function sheetToPdf(sheetCanvas, paperWmm, paperHmm) {
  const { PDFDocument } = await import('pdf-lib')
  const jpg = await new Promise((resolve, reject) => sheetCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the PDF.'))), 'image/jpeg', 0.95))
  const doc = await PDFDocument.create()
  const w = (paperWmm / 25.4) * 72
  const h = (paperHmm / 25.4) * 72
  const page = doc.addPage([w, h])
  page.drawImage(await doc.embedJpg(new Uint8Array(await jpg.arrayBuffer())), { x: 0, y: 0, width: w, height: h })
  return new Blob([await doc.save()], { type: 'application/pdf' })
}
