import { useMemo, useState } from 'react'
import { NumberField, ResultBox, SegmentedControl } from '../../components/calcParts'
import { num, calculateEmi, buildSchedule, formatMoney, CURRENCIES } from '../calc/calculators'

export default function EmiCalculatorTool() {
  const [amount, setAmount] = useState('1000000')
  const [rate, setRate] = useState('8.5')
  const [tenure, setTenure] = useState('20')
  const [unit, setUnit] = useState('years')
  const [currency, setCurrency] = useState('INR')
  const [monthly, setMonthly] = useState(false)

  const principal = num(amount)
  const annualRate = num(rate)
  const months = Math.round(unit === 'years' ? num(tenure) * 12 : num(tenure))
  const valid = principal > 0 && annualRate >= 0 && annualRate <= 100 && months >= 1 && months <= 600

  const calc = useMemo(() => (valid ? calculateEmi(principal, annualRate, months) : null), [valid, principal, annualRate, months])
  const schedule = useMemo(() => (valid ? buildSchedule(principal, annualRate, months) : { rows: [], years: [] }), [valid, principal, annualRate, months])
  const money = (v, d = 0) => formatMoney(v, currency, d)
  const principalShare = calc ? (principal / calc.totalPayment) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="h-fit space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Loan details</h2>
          <div>
            <label htmlFor="emi-currency" className="mb-1.5 block text-sm font-medium text-ink">Currency</label>
            <select id="emi-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink">
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <option key={code} value={code}>{c.label}</option>
              ))}
            </select>
          </div>
          <NumberField id="emi-amount" label="Loan amount" prefix={CURRENCIES[currency].symbol} min="0" value={amount} onChange={setAmount} />
          <NumberField id="emi-rate" label="Interest rate (per year)" suffix="%" min="0" step="0.01" value={rate} onChange={setRate} />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField id="emi-tenure" label="Loan tenure" min="1" value={tenure} onChange={setTenure} />
            <SegmentedControl
              options={[
                { value: 'years', label: 'Years' },
                { value: 'months', label: 'Months' },
              ]}
              value={unit}
              onChange={setUnit}
            />
          </div>
          {!valid && <p className="text-xs text-rose-600">Enter a loan amount, an interest rate (0–100%) and a tenure of up to 50 years.</p>}
        </div>

        <div className="space-y-3">
          <ResultBox strong label="Monthly EMI" value={calc ? money(calc.emi) : '—'} />
          <div className="grid grid-cols-2 gap-3">
            <ResultBox label="Total interest" value={calc ? money(calc.totalInterest) : '—'} />
            <ResultBox label="Total payment" value={calc ? money(calc.totalPayment) : '—'} />
          </div>
          {calc && (
            <div className="rounded-xl bg-mist p-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-fog" role="img" aria-label={`Principal ${principalShare.toFixed(0)} percent, interest ${(100 - principalShare).toFixed(0)} percent`}>
                <div style={{ width: `${principalShare}%`, background: 'var(--color-brand-500)' }} />
                <div style={{ width: `${100 - principalShare}%`, background: 'var(--color-amber-500)' }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-ink-soft">
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-brand-500)' }} />Principal {principalShare.toFixed(0)}%</span>
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-amber-500)' }} />Interest {(100 - principalShare).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {calc && (
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Repayment schedule</h2>
            <SegmentedControl
              options={[
                { value: false, label: 'By year' },
                { value: true, label: 'By month' },
              ]}
              value={monthly}
              onChange={setMonthly}
            />
          </div>
          <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-mist text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-medium">{monthly ? 'Month' : 'Year'}</th>
                  <th className="px-3 py-2 text-right font-medium">Principal</th>
                  <th className="px-3 py-2 text-right font-medium">Interest</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(monthly ? schedule.rows : schedule.years).map((row) => (
                  <tr key={monthly ? row.month : row.year} className="border-t border-line">
                    <td className="px-3 py-2 text-ink">{monthly ? row.month : row.year}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{money(row.principal)}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{money(row.interest)}</td>
                    <td className="px-3 py-2 text-right text-ink">{money(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
