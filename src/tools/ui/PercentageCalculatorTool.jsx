import { useState } from 'react'
import { NumberField, ResultBox } from '../../components/calcParts'
import { num, percentOf, whatPercent, percentChange, addPercent, subtractPercent, formatNumber } from '../calc/calculators'

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

const show = (n, suffix = '') => (Number.isFinite(n) ? `${formatNumber(n)}${suffix}` : '—')

export default function PercentageCalculatorTool() {
  const [a1, setA1] = useState('')
  const [b1, setB1] = useState('')
  const [a2, setA2] = useState('')
  const [b2, setB2] = useState('')
  const [a3, setA3] = useState('')
  const [b3, setB3] = useState('')
  const [a4, setA4] = useState('')
  const [b4, setB4] = useState('')

  const change = percentChange(num(a3), num(b3))

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="What is X% of Y?">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="p1a" label="Percentage" suffix="%" value={a1} onChange={setA1} />
          <NumberField id="p1b" label="Of the number" value={b1} onChange={setB1} />
        </div>
        <ResultBox strong label="Result" value={show(percentOf(num(a1), num(b1)))} />
      </Card>

      <Card title="X is what percent of Y?">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="p2a" label="Number X" value={a2} onChange={setA2} />
          <NumberField id="p2b" label="Number Y" value={b2} onChange={setB2} />
        </div>
        <ResultBox strong label="Result" value={show(whatPercent(num(a2), num(b2)), '%')} hint={num(b2) === 0 ? 'Y can’t be zero' : undefined} />
      </Card>

      <Card title="Percentage increase / decrease">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="p3a" label="From (old value)" value={a3} onChange={setA3} />
          <NumberField id="p3b" label="To (new value)" value={b3} onChange={setB3} />
        </div>
        <ResultBox
          strong
          label={change === null || !Number.isFinite(change) ? 'Change' : change >= 0 ? 'Increase' : 'Decrease'}
          value={show(change === null ? NaN : Math.abs(change), '%')}
          hint={num(a3) === 0 ? 'The old value can’t be zero' : undefined}
        />
      </Card>

      <Card title="Add or subtract a percentage">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="p4a" label="Percentage" suffix="%" value={a4} onChange={setA4} />
          <NumberField id="p4b" label="Number" value={b4} onChange={setB4} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ResultBox label="Number + percentage" value={show(addPercent(num(b4), num(a4)))} />
          <ResultBox label="Number − percentage" value={show(subtractPercent(num(b4), num(a4)))} />
        </div>
      </Card>
    </div>
  )
}
