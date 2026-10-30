import { useMemo, useState } from 'react'
import StatusBanner from '../../components/StatusBanner'
import { ResultBox } from '../../components/calcParts'
import { calculateAge, todayYmd, formatNumber } from '../calc/calculators'

const DATE_FMT = { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

export default function AgeCalculatorTool() {
  const [dob, setDob] = useState('')
  const [asOf, setAsOf] = useState(todayYmd())

  const age = useMemo(() => (dob ? calculateAge(dob, asOf) : null), [dob, asOf])
  const nextBirthday = age && !age.error ? new Date(Date.UTC(age.nextBirthday.y, age.nextBirthday.m - 1, age.nextBirthday.d)).toLocaleDateString('en-GB', DATE_FMT) : null

  const dateInput = 'mt-1.5 w-full rounded-xl border border-line bg-mist p-2.5 text-sm text-ink'

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="h-fit rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Enter the dates</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="dob" className="text-sm font-medium text-ink">Date of birth</label>
            <input id="dob" type="date" value={dob} max={asOf} onChange={(e) => setDob(e.target.value)} className={dateInput} />
          </div>
          <div>
            <label htmlFor="asof" className="text-sm font-medium text-ink">Age at the date of</label>
            <input id="asof" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value || todayYmd())} className={dateInput} />
            <button type="button" onClick={() => setAsOf(todayYmd())} className="mt-1.5 text-xs font-semibold underline" style={{ color: 'var(--color-brand-600)' }}>
              Use today
            </button>
          </div>
        </div>
      </div>

      <div>
        {!age && (
          <div className="rounded-2xl border border-dashed border-line bg-mist p-10 text-center text-sm text-ink-soft">Pick a date of birth to see the exact age.</div>
        )}
        {age?.error && <StatusBanner type="error">{age.error}</StatusBanner>}
        {age && !age.error && (
          <div className="space-y-3">
            <ResultBox strong label="Exact age" value={`${age.years} years, ${age.months} months, ${age.days} days`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultBox label="Total months" value={formatNumber(age.totalMonths, 0)} />
              <ResultBox label="Total weeks" value={formatNumber(age.totalWeeks, 0)} />
              <ResultBox label="Total days" value={formatNumber(age.totalDays, 0)} />
              <ResultBox label="Total hours" value={formatNumber(age.totalHours, 0)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ResultBox label="Born on a" value={age.bornOn} />
              <ResultBox label="Next birthday" value={age.daysToBirthday === 0 ? 'Today! 🎉' : `in ${formatNumber(age.daysToBirthday, 0)} days`} hint={age.daysToBirthday === 0 ? undefined : nextBirthday} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
