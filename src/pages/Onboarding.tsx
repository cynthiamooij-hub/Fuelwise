import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'
import { validateAboutYou, type FieldErrors } from '@/lib/nutrition'
import { ACTIVITY_OPTIONS, CYCLE_CONSENT, GOAL_OPTIONS, PROFILE_CONSENT } from '@/lib/copy'
import type { ActivityLevel, Goal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Wordmark } from '@/components/Wordmark'
import { Field } from '@/components/Field'
import { DataStatement } from '@/components/DataStatement'
import { CycleFields, validateCycle, type CycleErrors, type CycleValues } from '@/components/CycleFields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const STEPS = ['About you', 'Your days', 'Your goal', 'Cycle guidance']

export function ChoiceCard({ selected, onSelect, title, body, name }: { selected: boolean; onSelect: () => void; title: string; body: string; name: string }) {
  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors',
        selected ? 'border-olive bg-fill' : 'border-line bg-white/60 hover:bg-fill',
      )}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      <span
        className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-olive bg-olive' : 'border-muted')}
        aria-hidden
      >
        {selected && <Check className="size-4 text-white" />}
      </span>
      <span>
        <span className="block font-medium text-deep">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
    </label>
  )
}

export function Onboarding() {
  const { session, refreshProfile } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [about, setAbout] = useState({ display_name: '', age: '', height_cm: '', weight_kg: '' })
  const [aboutErrors, setAboutErrors] = useState<FieldErrors>({})
  const [underAge, setUnderAge] = useState(false)
  const [activity, setActivity] = useState<ActivityLevel | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [cycleOn, setCycleOn] = useState(false)
  const [cycle, setCycle] = useState<CycleValues>({ cycle_length_days: '28', period_length_days: '5', last_period_start: '' })
  const [cycleErrors, setCycleErrors] = useState<CycleErrors>({})
  const [profileConsent, setProfileConsent] = useState(false)
  const [cycleConsent, setCycleConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveIssue, setSaveIssue] = useState('')

  function next() {
    if (step === 0) {
      const { errors, underAge } = validateAboutYou(about)
      setAboutErrors(errors)
      if (Object.keys(errors).length) return
      if (underAge) return setUnderAge(true)
    }
    if (step === 1 && !activity) return
    if (step === 2 && !goal) return
    setStep((s) => s + 1)
  }

  const canSave = profileConsent && (!cycleOn || cycleConsent) && !saving

  async function save() {
    if (!session || !activity || !goal || !canSave) return
    if (cycleOn) {
      const e = validateCycle(cycle)
      setCycleErrors(e)
      if (Object.keys(e).length) return
    }
    setSaving(true)
    setSaveIssue('')
    const { error } = await supabase.from('profiles').insert({
      user_id: session.user.id,
      display_name: about.display_name.trim(),
      age: Number(about.age),
      height_cm: Math.round(Number(about.height_cm)),
      weight_kg: Math.round(Number(about.weight_kg) * 10) / 10,
      activity_level: activity,
      goal,
      cycle_enabled: cycleOn,
      cycle_length_days: cycleOn ? Number(cycle.cycle_length_days) : null,
      period_length_days: cycleOn ? Number(cycle.period_length_days) : null,
      last_period_start: cycleOn ? cycle.last_period_start : null,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
    })
    setSaving(false)
    if (error) return setSaveIssue('We couldn’t save just now. Please try again in a moment.')
    await refreshProfile()
    navigate('/', { replace: true })
  }

  if (underAge) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <Wordmark className="text-3xl" />
        <h1 className="mt-6 text-2xl">Fuelwise is made for adults</h1>
        <p className="mt-3 text-deep">
          The estimates in this app are designed for people aged 18 and over, so we can’t set up a profile for you. Nothing you entered has been saved.
        </p>
        <p className="mt-3 text-deep">A GP or school nurse can help with guidance that fits you.</p>
      </main>
    )
  }

  const set = (k: keyof typeof about) => (e: React.ChangeEvent<HTMLInputElement>) => setAbout({ ...about, [k]: e.target.value })

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-6 pb-16">
      <Wordmark className="text-2xl" />
      <ol className="mt-6 flex gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <li key={s} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-terracotta' : 'bg-line')}>
            <span className="sr-only">{s}{i === step ? ' (current)' : ''}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">Step {step + 1} of {STEPS.length}</p>
      <h1 className="mt-1 text-3xl">{STEPS[step]}</h1>

      {step === 0 && (
        <div className="mt-6 space-y-4">
          <p className="text-deep">A few basics so the estimate fits you.</p>
          <Field id="display_name" label="First name" error={aboutErrors.display_name}>
            <Input id="display_name" autoComplete="given-name" value={about.display_name} onChange={set('display_name')} aria-describedby="display_name-msg" />
          </Field>
          <Field id="age" label="Age" error={aboutErrors.age}>
            <Input id="age" inputMode="numeric" value={about.age} onChange={set('age')} aria-describedby="age-msg" />
          </Field>
          <Field id="height_cm" label="Height (cm)" error={aboutErrors.height_cm}>
            <Input id="height_cm" inputMode="numeric" value={about.height_cm} onChange={set('height_cm')} aria-describedby="height_cm-msg" />
          </Field>
          <Field id="weight_kg" label="Weight (kg)" error={aboutErrors.weight_kg}>
            <Input id="weight_kg" inputMode="decimal" value={about.weight_kg} onChange={set('weight_kg')} aria-describedby="weight_kg-msg" />
          </Field>
        </div>
      )}

      {step === 1 && (
        <fieldset className="mt-6 space-y-3">
          <legend className="mb-3 text-deep">Which sounds most like a typical week?</legend>
          {ACTIVITY_OPTIONS.map((o) => (
            <ChoiceCard key={o.value} name="activity" selected={activity === o.value} onSelect={() => setActivity(o.value)} title={o.label} body={o.example} />
          ))}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="mt-6 space-y-3">
          <legend className="mb-3 text-deep">What would you like your food to help with?</legend>
          {GOAL_OPTIONS.map((o) => (
            <ChoiceCard key={o.value} name="goal" selected={goal === o.value} onSelect={() => setGoal(o.value)} title={o.label} body={o.line} />
          ))}
        </fieldset>
      )}

      {step === 3 && (
        <div className="mt-6 space-y-5">
          <div className="space-y-2 text-deep">
            <p>Fuelwise can use where you are in your cycle to shape your plate — more iron-rich food around your period, and more filling food in the days before it, when appetite is often higher.</p>
            <p>It won’t predict fertility, track symptoms or tell you anything is wrong. The app is complete without it, and you can switch it off at any time in Settings.</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-fill p-4">
            <Label htmlFor="cycle-toggle" className="text-base">Use cycle guidance</Label>
            <Switch id="cycle-toggle" checked={cycleOn} onCheckedChange={(v) => { setCycleOn(v); if (!v) setCycleConsent(false) }} />
          </div>
          {cycleOn && <CycleFields values={cycle} errors={cycleErrors} onChange={setCycle} />}

          <DataStatement />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox id="profile-consent" checked={profileConsent} onCheckedChange={(v) => setProfileConsent(v === true)} />
              <Label htmlFor="profile-consent" className="font-normal">{PROFILE_CONSENT}</Label>
            </div>
            {cycleOn && (
              <div className="flex items-start gap-3">
                <Checkbox id="cycle-consent" checked={cycleConsent} onCheckedChange={(v) => setCycleConsent(v === true)} />
                <Label htmlFor="cycle-consent" className="font-normal">{CYCLE_CONSENT}</Label>
              </div>
            )}
          </div>
          {saveIssue && <p className="text-deep" role="status">{saveIssue}</p>}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft aria-hidden /> Back
          </Button>
        )}
        {step < 3 ? (
          <Button className="flex-1" onClick={next} disabled={(step === 1 && !activity) || (step === 2 && !goal)}>
            Continue <ArrowRight aria-hidden />
          </Button>
        ) : (
          <Button className="flex-1" onClick={save} disabled={!canSave}>
            {saving ? 'Saving…' : 'See my plate'}
          </Button>
        )}
      </div>
      {step === 3 && !canSave && !saving && (
        <p className="mt-3 text-sm text-muted">
          {cycleOn ? 'Tick both boxes above to continue.' : 'Tick the box above to continue.'}
        </p>
      )}
    </main>
  )
}
