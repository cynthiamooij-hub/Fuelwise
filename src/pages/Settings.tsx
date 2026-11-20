import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, LogOut, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import { validateAboutYou, type FieldErrors } from '@/lib/nutrition'
import { ACTIVITY_OPTIONS, CYCLE_CONSENT, GOAL_OPTIONS } from '@/lib/copy'
import type { ActivityLevel, Goal } from '@/lib/types'
import { AppShell } from '@/components/AppShell'
import { Field } from '@/components/Field'
import { CycleFields, validateCycle, type CycleErrors, type CycleValues } from '@/components/CycleFields'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function Settings() {
  const { profile, session, refreshProfile, signOut } = useApp()
  const navigate = useNavigate()
  const [about, setAbout] = useState({ display_name: '', age: '', height_cm: '', weight_kg: '' })
  const [activity, setActivity] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<Goal>('energy')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [savedMsg, setSavedMsg] = useState('')

  const [cycle, setCycle] = useState<CycleValues>({ cycle_length_days: '28', period_length_days: '5', last_period_start: '' })
  const [cycleErrors, setCycleErrors] = useState<CycleErrors>({})
  const [enabling, setEnabling] = useState(false)
  const [cycleConsent, setCycleConsent] = useState(false)
  const [cycleMsg, setCycleMsg] = useState('')

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteIssue, setDeleteIssue] = useState('')

  useEffect(() => {
    if (!profile) return
    setAbout({
      display_name: profile.display_name,
      age: String(profile.age),
      height_cm: String(profile.height_cm),
      weight_kg: String(profile.weight_kg),
    })
    setActivity(profile.activity_level)
    setGoal(profile.goal)
    setCycle({
      cycle_length_days: String(profile.cycle_length_days ?? 28),
      period_length_days: String(profile.period_length_days ?? 5),
      last_period_start: profile.last_period_start ?? '',
    })
  }, [profile])

  useEffect(() => {
    if (window.location.hash === '#cycle') document.getElementById('cycle')?.scrollIntoView()
  }, [])

  if (!profile || !session) return null

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavedMsg('')
    const { errors, underAge } = validateAboutYou(about)
    if (underAge) errors.age = 'Fuelwise is designed for adults aged 18 and over.'
    setErrors(errors)
    if (Object.keys(errors).length) return
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: about.display_name.trim(),
        age: Number(about.age),
        height_cm: Math.round(Number(about.height_cm)),
        weight_kg: Math.round(Number(about.weight_kg) * 10) / 10,
        activity_level: activity,
        goal,
      })
      .eq('user_id', session!.user.id)
    setSavedMsg(error ? 'We couldn’t save just now. Please try again.' : 'Saved.')
    if (!error) await refreshProfile()
  }

  async function saveCycle(enable: boolean) {
    setCycleMsg('')
    if (enable) {
      const errs = validateCycle(cycle)
      setCycleErrors(errs)
      if (Object.keys(errs).length) return
      if (!profile!.cycle_enabled && !cycleConsent) return
    }
    // Switching off sets the three cycle fields to null — the data is deleted, not hidden.
    const { error } = await supabase
      .from('profiles')
      .update(
        enable
          ? {
              cycle_enabled: true,
              cycle_length_days: Number(cycle.cycle_length_days),
              period_length_days: Number(cycle.period_length_days),
              last_period_start: cycle.last_period_start,
            }
          : { cycle_enabled: false, cycle_length_days: null, period_length_days: null, last_period_start: null },
      )
      .eq('user_id', session!.user.id)
    if (error) return setCycleMsg('We couldn’t save just now. Please try again.')
    setEnabling(false)
    setCycleConsent(false)
    setCycleMsg(enable ? 'Cycle details saved.' : 'Cycle guidance is off and your cycle details have been deleted.')
    await refreshProfile()
  }

  async function deleteAll() {
    setDeleting(true)
    setDeleteIssue('')
    const uid = session!.user.id
    const foods = await supabase.from('food_items').delete().eq('owner_id', uid)
    const prof = await supabase.from('profiles').delete().eq('user_id', uid)
    if (foods.error || prof.error) {
      setDeleting(false)
      return setDeleteIssue('Something interrupted the deletion. Please try again.')
    }
    await signOut()
    navigate('/data-deleted', { replace: true })
  }

  const set = (k: keyof typeof about) => (e: React.ChangeEvent<HTMLInputElement>) => setAbout({ ...about, [k]: e.target.value })
  const showCycleFields = profile.cycle_enabled || enabling

  return (
    <AppShell>
      <h1 className="text-3xl">Settings</h1>

      <Card className="mt-6">
        <h2 className="text-xl">Your profile</h2>
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <Field id="display_name" label="First name" error={errors.display_name}>
            <Input id="display_name" value={about.display_name} onChange={set('display_name')} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field id="age" label="Age" error={errors.age}>
              <Input id="age" inputMode="numeric" value={about.age} onChange={set('age')} />
            </Field>
            <Field id="height_cm" label="Height (cm)" error={errors.height_cm}>
              <Input id="height_cm" inputMode="numeric" value={about.height_cm} onChange={set('height_cm')} />
            </Field>
            <Field id="weight_kg" label="Weight (kg)" error={errors.weight_kg}>
              <Input id="weight_kg" inputMode="decimal" value={about.weight_kg} onChange={set('weight_kg')} />
            </Field>
          </div>
          <Field id="activity" label="A typical week">
            <Select id="activity" value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
              {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field id="goal" label="What your food helps with">
            <Select id="goal" value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
              {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit">Save profile</Button>
            {savedMsg && <p className="text-sm text-deep" role="status">{savedMsg}</p>}
          </div>
        </form>
      </Card>

      <Card className="mt-6" id="cycle">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl">Cycle guidance</h2>
            <p className="mt-1 text-sm text-muted">Optional. The app works fully without it.</p>
          </div>
          <Switch
            aria-label="Cycle guidance"
            checked={profile.cycle_enabled || enabling}
            onCheckedChange={(on) => {
              if (on) setEnabling(true)
              else if (profile.cycle_enabled) saveCycle(false)
              else setEnabling(false)
            }}
          />
        </div>
        {showCycleFields && (
          <div className="mt-4 space-y-4">
            <CycleFields values={cycle} errors={cycleErrors} onChange={setCycle} />
            {!profile.cycle_enabled && (
              <div className="flex items-start gap-3">
                <Checkbox id="cycle-consent" checked={cycleConsent} onCheckedChange={(v) => setCycleConsent(v === true)} />
                <Label htmlFor="cycle-consent" className="font-normal">{CYCLE_CONSENT}</Label>
              </div>
            )}
            <Button onClick={() => saveCycle(true)} disabled={!profile.cycle_enabled && !cycleConsent}>
              Save cycle details
            </Button>
          </div>
        )}
        {cycleMsg && <p className="mt-3 text-sm text-deep" role="status">{cycleMsg}</p>}
        <p className="mt-3 text-sm text-muted">Switching this off deletes your cycle details straight away.</p>
      </Card>

      <Card className="mt-6 space-y-2">
        <h2 className="text-xl">Your data</h2>
        <Link to="/privacy" className="flex min-h-11 items-center gap-2 text-terracotta-dark underline underline-offset-4">
          <FileText className="size-5" aria-hidden /> How your data is used
        </Link>
        <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
          <LogOut aria-hidden /> Sign out
        </Button>
        <div className="border-t border-line pt-4">
          <p className="text-sm text-muted">Removes your profile, cycle details and any foods you added, then signs you out.</p>
          <Button variant="destructive" className="mt-3 w-full sm:w-auto" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden /> Delete all my data
          </Button>
        </div>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent
          title="Delete all your data?"
          description="Your profile, cycle details and the foods you added will be permanently deleted. This can’t be undone."
        >
          {deleteIssue && <p className="mb-3 text-deep" role="status">{deleteIssue}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>Keep my data</Button>
            <Button variant="destructive" className="flex-1" onClick={deleteAll} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Yes, delete everything'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
