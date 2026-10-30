import { useState } from 'react'
import { NumberField, ResultBox, SegmentedControl } from '../../components/calcParts'
import { num, calculateGst, formatMoney } from '../calc/calculators'

// Current slabs under GST 2.0 (in force since 22 Sep 2025), plus the special 3% rate for gold/silver.
const RATES = [
  { value: 3, label: '3%' },
  { value: 5, label: '5%' },
  { value: 18, label: '18%' },
  { value: 40, label: '40%' },
  { value: 'custom', label: 'Custom' },
]

export default function GstCalculatorTool() {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(18)
  const [customRate, setCustomRate] = useState('')
  const [mode, setMode] = useState('add')
  const [supply, setSupply] = useState('intra')

  const rateValue = rate === 'custom' ? num(customRate) : rate
  const amountValue = num(amount)
  const valid = Number.isFinite(amountValue) && amountValue >= 0 && Number.isFinite(rateValue) && rateValue >= 0 && rateValue <= 100
  const r = valid ? calculateGst(amountValue, rateValue, mode) : null
  const money = (v) => (r ? formatMoney(v, 'INR') : '—')

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="h-fit space-y-5 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">GST details</h2>
        <SegmentedControl
          label="What do you want to do?"
          options={[
            { value: 'add', label: 'Add GST' },
            { value: 'remove', label: 'Remove GST' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <NumberField id="gst-amount" label={mode === 'add' ? 'Amount (without GST)' : 'Amount (including GST)'} prefix="₹" min="0" value={amount} onChange={setAmount} />
        <SegmentedControl label="GST rate" options={RATES} value={rate} onChange={setRate} />
        {rate === 'custom' && <NumberField id="gst-custom" label="Custom rate" suffix="%" min="0" value={customRate} onChange={setCustomRate} placeholder="e.g. 12" />}
        <SegmentedControl
          label="Type of sale"
          options={[
            { value: 'intra', label: 'Within the state (CGST + SGST)' },
            { value: 'inter', label: 'Other state (IGST)' },
          ]}
          value={supply}
          onChange={setSupply}
        />
        <p className="rounded-lg bg-mist p-3 text-xs leading-relaxed text-ink-soft">
          Rates shown are the slabs in force since GST 2.0 (22 September 2025): 5%, 18% and 40%, plus 3% for gold and silver. Older invoices may use 12% or 28% — pick “Custom” for those. Always confirm the rate for your HSN/SAC code.
        </p>
      </div>

      <div className="space-y-3">
        <ResultBox strong label="Total amount (incl. GST)" value={money(r?.total)} />
        <div className="grid grid-cols-2 gap-3">
          <ResultBox label="Amount before GST" value={money(r?.net)} />
          <ResultBox label={`GST @ ${Number.isFinite(rateValue) ? rateValue : '—'}%`} value={money(r?.gst)} />
        </div>
        {supply === 'intra' ? (
          <div className="grid grid-cols-2 gap-3">
            <ResultBox label={`CGST @ ${Number.isFinite(rateValue) ? rateValue / 2 : '—'}%`} value={money(r?.cgst)} />
            <ResultBox label={`SGST @ ${Number.isFinite(rateValue) ? rateValue / 2 : '—'}%`} value={money(r?.sgst)} />
          </div>
        ) : (
          <ResultBox label={`IGST @ ${Number.isFinite(rateValue) ? rateValue : '—'}%`} value={money(r?.igst)} />
        )}
      </div>
    </div>
  )
}
