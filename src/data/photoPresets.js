// Starting points for the photo / signature resizer. Requirements change between
// exam cycles and published sources often disagree, so every value stays editable
// in the tool, and where sources conflicted we used the range that satisfies all of them.

// 3.5 × 4.5 cm and 3.5 × 1.5 cm at 300 DPI
const PHOTO_35x45 = { w: 413, h: 531 }
const SIG_35x15 = { w: 413, h: 177 }

export const EXAM_PRESETS = [
  { id: 'bank-photo', kind: 'photo', label: 'Photo 200×230 px · 20–50 KB', w: 200, h: 230, minKB: 20, maxKB: 50, note: 'A common size for bank exams (IBPS, SBI) and older SSC forms.' },
  { id: 'bank-sig', kind: 'signature', label: 'Signature 140×60 px · 10–20 KB', w: 140, h: 60, minKB: 10, maxKB: 20, note: 'A common size for IBPS, SBI and SSC. Sign in black ink on white paper.' },
  { id: 'neet-photo', kind: 'photo', label: 'NEET photo · 3.5×4.5 cm · 10–200 KB', ...PHOTO_35x45, minKB: 10, maxKB: 200, note: 'Based on recent NEET UG notices: JPG, 10–200 KB.' },
  { id: 'neet-sig', kind: 'signature', label: 'NEET signature · 10–30 KB', ...SIG_35x15, minKB: 10, maxKB: 30, note: 'Sources disagree (4–30 KB vs 10–100 KB), so this range fits both.' },
  { id: 'jee-photo', kind: 'photo', label: 'JEE Main photo · 3.5×4.5 cm · 10–200 KB', ...PHOTO_35x45, minKB: 10, maxKB: 200, note: 'Based on the 2026 JEE Main notice (the limit was 300 KB in earlier years).' },
  { id: 'jee-sig', kind: 'signature', label: 'JEE Main signature · 3.5×1.5 cm · 10–50 KB', ...SIG_35x15, minKB: 10, maxKB: 50, note: 'Sources disagree (10–100 KB now, 4–50 KB earlier), so this range fits both.' },
  { id: 'custom-photo', kind: 'photo', label: 'Custom photo size', w: 413, h: 531, minKB: 0, maxKB: 100, note: 'Enter the exact size your form asks for.' },
  { id: 'custom-sig', kind: 'signature', label: 'Custom signature size', w: 300, h: 120, minKB: 0, maxKB: 50, note: 'Enter the exact size your form asks for.' },
]

// Which presets a landing page starts with.
export const EXAM_PAGES = {
  neet: { photo: 'neet-photo', signature: 'neet-sig' },
  jee: { photo: 'jee-photo', signature: 'jee-sig' },
  bank: { photo: 'bank-photo', signature: 'bank-sig' },
  default: { photo: 'bank-photo', signature: 'bank-sig' },
}

export const PASSPORT_PRESETS = [
  { id: '35x45', label: '35 × 45 mm', note: 'India, UK, EU / Schengen, Australia and many other countries', wMM: 35, hMM: 45 },
  { id: '2x2in', label: '2 × 2 in (51 × 51 mm)', note: 'US passports and visas, and some Indian visa forms', wMM: 50.8, hMM: 50.8 },
  { id: '50x70', label: '50 × 70 mm', note: 'Canada', wMM: 50, hMM: 70 },
  { id: '33x48', label: '33 × 48 mm', note: 'China visa', wMM: 33, hMM: 48 },
]
