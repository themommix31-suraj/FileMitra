// Pure calculation helpers for the calculator tools (no DOM / React here,
// so they are easy to test).

/* ---------------- percentage ---------------- */

export const percentOf = (percent, value) => (percent / 100) * value

/** "A is what % of B" — null when B is 0. */
export const whatPercent = (part, whole) => (whole === 0 ? null : (part / whole) * 100)

/** % change from `from` to `to` — null when `from` is 0. */
export const percentChange = (from, to) => (from === 0 ? null : ((to - from) / Math.abs(from)) * 100)

export const addPercent = (value, percent) => value + percentOf(percent, value)
export const subtractPercent = (value, percent) => value - percentOf(percent, value)

/* ---------------- age ---------------- */

const daysInMonth = (year, month /* 1-12 */) => new Date(Date.UTC(year, month, 0)).getUTCDate()

export function parseYmd(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '')
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null
  return { y, m: mo, d }
}

export function todayYmd() {
  const n = new Date()
  const pad = (v) => String(v).padStart(2, '0')
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`
}

const utc = ({ y, m, d }) => Date.UTC(y, m - 1, d)
const DAY_MS = 86400000
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * @param {string} dobStr YYYY-MM-DD
 * @param {string} asOfStr YYYY-MM-DD
 */
export function calculateAge(dobStr, asOfStr) {
  const dob = parseYmd(dobStr)
  const asOf = parseYmd(asOfStr)
  if (!dob || !asOf) return { error: 'Please enter a valid date.' }
  if (utc(dob) > utc(asOf)) return { error: 'The date of birth must be on or before the “age at” date.' }

  let years = asOf.y - dob.y
  let months = asOf.m - dob.m
  let days = asOf.d - dob.d
  if (days < 0) {
    months -= 1
    const prevMonth = asOf.m === 1 ? 12 : asOf.m - 1
    const prevYear = asOf.m === 1 ? asOf.y - 1 : asOf.y
    days += daysInMonth(prevYear, prevMonth)
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const totalDays = Math.round((utc(asOf) - utc(dob)) / DAY_MS)

  // Next birthday (Feb 29 birthdays fall on Mar 1 in non-leap years).
  const birthdayIn = (year) => {
    if (dob.m === 2 && dob.d === 29 && daysInMonth(year, 2) === 28) return { y: year, m: 3, d: 1 }
    return { y: year, m: dob.m, d: dob.d }
  }
  let next = birthdayIn(asOf.y)
  if (utc(next) < utc(asOf)) next = birthdayIn(asOf.y + 1)
  const daysToBirthday = Math.round((utc(next) - utc(asOf)) / DAY_MS)

  return {
    years,
    months,
    days,
    totalMonths: years * 12 + months,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
    totalHours: totalDays * 24,
    nextBirthday: next,
    daysToBirthday,
    bornOn: WEEKDAYS[new Date(utc(dob)).getUTCDay()],
  }
}

/* ---------------- GST ---------------- */

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * @param {number} amount
 * @param {number} rate GST rate in percent
 * @param {'add'|'remove'} mode add = amount is before GST; remove = amount already includes GST
 */
export function calculateGst(amount, rate, mode = 'add') {
  const net = mode === 'add' ? amount : amount / (1 + rate / 100)
  const gst = round2(mode === 'add' ? (amount * rate) / 100 : amount - net)
  const netRounded = round2(mode === 'add' ? amount : amount - gst)
  const total = round2(netRounded + gst)
  const half = round2(gst / 2)
  return { net: netRounded, gst, total, cgst: half, sgst: round2(gst - half), igst: gst }
}

/* ---------------- EMI ---------------- */

export function calculateEmi(principal, annualRatePercent, months) {
  if (!(principal > 0) || !(months > 0) || annualRatePercent < 0) return null
  const r = annualRatePercent / 12 / 100
  const emi = r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  const totalPayment = emi * months
  return { emi, totalPayment, totalInterest: totalPayment - principal }
}

/** Month-by-month schedule plus a per-year summary. */
export function buildSchedule(principal, annualRatePercent, months) {
  const calc = calculateEmi(principal, annualRatePercent, months)
  if (!calc) return { rows: [], years: [] }
  const r = annualRatePercent / 12 / 100
  let balance = principal
  const rows = []
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const princ = Math.min(calc.emi - interest, balance)
    balance = Math.max(0, balance - princ)
    rows.push({ month: m, interest, principal: princ, balance: m === months ? 0 : balance })
  }
  const years = []
  rows.forEach((row) => {
    const y = Math.ceil(row.month / 12)
    if (!years[y - 1]) years[y - 1] = { year: y, interest: 0, principal: 0, balance: 0 }
    years[y - 1].interest += row.interest
    years[y - 1].principal += row.principal
    years[y - 1].balance = row.balance
  })
  return { rows, years }
}

/* ---------------- formatting ---------------- */

export const CURRENCIES = {
  INR: { symbol: '₹', locale: 'en-IN', label: '₹ INR' },
  USD: { symbol: '$', locale: 'en-US', label: '$ USD' },
  EUR: { symbol: '€', locale: 'de-DE', label: '€ EUR' },
  GBP: { symbol: '£', locale: 'en-GB', label: '£ GBP' },
}

export function formatMoney(value, currency = 'INR', decimals = 2) {
  const { symbol, locale } = CURRENCIES[currency] || CURRENCIES.INR
  const n = Number.isFinite(value) ? value : 0
  return `${symbol}${n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

export function formatNumber(value, maxDecimals = 4) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: maxDecimals })
}

/** Parses an input string to a number, or NaN when empty/invalid. */
export const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v))
