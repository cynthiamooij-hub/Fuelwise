import { Field } from './Field'
import { Input } from './ui/input'
import { localISODate } from '@/lib/nutrition'

export interface CycleValues {
  cycle_length_days: string
  period_length_days: string
  last_period_start: string
}

export type CycleErrors = Partial<Record<keyof CycleValues, string>>

export function validateCycle(v: CycleValues): CycleErrors {
  const e: CycleErrors = {}
  const L = Number(v.cycle_length_days)
  if (!v.cycle_length_days || !Number.isInteger(L) || L < 10 || L > 90)
    e.cycle_length_days = 'Please enter your usual cycle length in days — most are between 21 and 40.'
  const P = Number(v.period_length_days)
  if (!v.period_length_days || !Number.isInteger(P) || P < 1 || P > 15)
    e.period_length_days = 'Please enter how many days your period usually lasts.'
  if (!v.last_period_start) e.last_period_start = 'Add the date your most recent period started.'
  else if (v.last_period_start > localISODate()) e.last_period_start = 'This date is in the future — could you check it?'
  return e
}

export function CycleFields({ values, errors, onChange }: { values: CycleValues; errors: CycleErrors; onChange: (v: CycleValues) => void }) {
  const set = (k: keyof CycleValues) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [k]: e.target.value })
  return (
    <div className="space-y-4">
      <Field id="cycle_length_days" label="Typical cycle length (days)" hint="From the first day of one period to the day before the next." error={errors.cycle_length_days}>
        <Input id="cycle_length_days" inputMode="numeric" value={values.cycle_length_days} onChange={set('cycle_length_days')} aria-describedby="cycle_length_days-msg" />
      </Field>
      <Field id="period_length_days" label="Typical period length (days)" error={errors.period_length_days}>
        <Input id="period_length_days" inputMode="numeric" value={values.period_length_days} onChange={set('period_length_days')} aria-describedby="period_length_days-msg" />
      </Field>
      <Field id="last_period_start" label="First day of your most recent period" error={errors.last_period_start}>
        <Input id="last_period_start" type="date" max={localISODate()} value={values.last_period_start} onChange={set('last_period_start')} aria-describedby="last_period_start-msg" />
      </Field>
    </div>
  )
}
