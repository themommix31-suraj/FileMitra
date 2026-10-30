// Downloads the AI models used by the Background Remover / Passport Photo tools
// into public/models/ (they are too large to keep in git).
//
//   npm run models
//
// Models: U²-Net family (Apache-2.0) as packaged by the rembg project (MIT).
// Each file is verified against a pinned SHA-256 so a changed or corrupted
// download is never served to users.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://github.com/danielgatis/rembg/releases/download/v0.0.0'
const MODELS = [
  { file: 'u2netp.onnx', sha256: '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' },
  { file: 'silueta.onnx', sha256: '75da6c8d2f8096ec743d071951be73b4a8bc7b3e51d9a6625d63644f90ffeedb' },
]

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models')
mkdirSync(dir, { recursive: true })

const sha = (buf) => createHash('sha256').update(buf).digest('hex')
let failed = false

for (const { file, sha256 } of MODELS) {
  const target = join(dir, file)
  if (existsSync(target) && sha(readFileSync(target)) === sha256) {
    console.log(`[models] ${file} already present`)
    continue
  }
  try {
    console.log(`[models] downloading ${file} …`)
    const res = await fetch(`${BASE}/${file}`, { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (sha(buf) !== sha256) throw new Error('checksum mismatch — refusing to use this file')
    writeFileSync(target, buf)
    console.log(`[models] saved ${file} (${(buf.length / 1048576).toFixed(1)} MB)`)
  } catch (err) {
    failed = true
    if (existsSync(target)) unlinkSync(target)
    console.warn(`[models] WARNING: could not get ${file}: ${err.message}`)
  }
}

if (failed) {
  console.warn('[models] The background-removal tools will show an error until the models are available.')
  console.warn('[models] Re-run "npm run models" with internet access, or copy the .onnx files into public/models/ yourself.')
}
// Never fail the build because of a download problem.
process.exit(0)
