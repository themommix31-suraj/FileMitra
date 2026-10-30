const AMBIGUOUS = 'Il1O0'
const CHAR_SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
}

/**
 * Generates a cryptographically random password from the browser's
 * crypto.getRandomValues, entirely on-device.
 * @param {{ length: number, lower: boolean, upper: boolean, digits: boolean, symbols: boolean, excludeAmbiguous: boolean }} options
 */
export function generatePassword({ length = 16, lower = true, upper = true, digits = true, symbols = false, excludeAmbiguous = false } = {}) {
  let pool = ''
  if (lower) pool += CHAR_SETS.lower
  if (upper) pool += CHAR_SETS.upper
  if (digits) pool += CHAR_SETS.digits
  if (symbols) pool += CHAR_SETS.symbols
  if (excludeAmbiguous) pool = pool.split('').filter((c) => !AMBIGUOUS.includes(c)).join('')

  if (!pool) throw new Error('Select at least one character type.')

  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) out += pool[bytes[i] % pool.length]
  return out
}

export function generateUuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  // Fallback for older browsers.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
