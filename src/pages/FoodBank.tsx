import { useMemo, useState } from 'react'
import { Citrus, Droplet, Pencil, Plus, Search, Soup, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import type { FoodGroup, FoodItem, MealSlot } from '@/lib/types'
import { AppShell } from '@/components/AppShell'
import { Field } from '@/components/Field'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const GROUPS: { value: FoodGroup; label: string; emoji: string }[] = [
  { value: 'protein', label: 'Protein', emoji: '🍗' },
  { value: 'carb', label: 'Carbs', emoji: '🍞' },
  { value: 'fat', label: 'Fats, nuts & seeds', emoji: '🥑' },
  { value: 'vegetable', label: 'Vegetables', emoji: '🥦' },
  { value: 'fruit', label: 'Fruit', emoji: '🍓' },
  { value: 'snack', label: 'Snacks', emoji: '🥜' },
]

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: 'any', label: 'Any meal' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

type Draft = {
  name: string
  food_group: FoodGroup
  emoji: string
  portion_description: string
  kcal_per_portion: string
  protein_g: string
  carbs_g: string
  fat_g: string
  meal_slot: MealSlot
  iron_rich: boolean
  high_satiety: boolean
  vitamin_c_rich: boolean
}

const EMPTY: Draft = {
  name: '', food_group: 'protein', emoji: '🍽️', portion_description: '', kcal_per_portion: '', protein_g: '', carbs_g: '', fat_g: '',
  meal_slot: 'any', iron_rich: false, high_satiety: false, vitamin_c_rich: false,
}

function toDraft(f: FoodItem): Draft {
  return {
    name: f.name, food_group: f.food_group, emoji: f.emoji, portion_description: f.portion_description,
    kcal_per_portion: String(f.kcal_per_portion), protein_g: String(f.protein_g), carbs_g: String(f.carbs_g), fat_g: String(f.fat_g),
    meal_slot: f.meal_slot, iron_rich: f.iron_rich, high_satiety: f.high_satiety, vitamin_c_rich: f.vitamin_c_rich,
  }
}

function Marker({ icon: Icon, label }: { icon: typeof Droplet; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-xs font-medium text-olive">
      <Icon className="size-3.5" aria-hidden /> {label}
    </span>
  )
}

function ItemForm({ initial, onDone }: { initial?: FoodItem; onDone: () => void }) {
  const { session, refreshFoods } = useApp()
  const [d, setD] = useState<Draft>(initial ? toDraft(initial) : EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [busy, setBusy] = useState(false)
  const [issue, setIssue] = useState('')
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!d.name.trim()) errs.name = 'Give it a name.'
    if (!d.emoji.trim()) errs.emoji = 'Pick an emoji.'
    if (!d.portion_description.trim()) errs.portion_description = 'Describe one portion, e.g. “1 bowl (±200g)”.'
    for (const k of ['kcal_per_portion', 'protein_g', 'carbs_g', 'fat_g'] as const) {
      const n = Number(d[k])
      if (d[k] === '' || !Number.isFinite(n) || n < 0 || (k === 'kcal_per_portion' && n > 3000)) errs[k] = 'Enter a number per portion.'
    }
    setErrors(errs)
    if (Object.keys(errs).length || !session) return
    setBusy(true)
    const row = {
      name: d.name.trim(), food_group: d.food_group, emoji: d.emoji.trim(), portion_description: d.portion_description.trim(),
      kcal_per_portion: Math.round(Number(d.kcal_per_portion)), protein_g: Number(d.protein_g), carbs_g: Number(d.carbs_g), fat_g: Number(d.fat_g),
      meal_slot: d.meal_slot, iron_rich: d.iron_rich, high_satiety: d.high_satiety, vitamin_c_rich: d.vitamin_c_rich,
      is_custom: true, owner_id: session.user.id,
    }
    const { error } = initial
      ? await supabase.from('food_items').update(row).eq('id', initial.id)
      : await supabase.from('food_items').insert(row)
    setBusy(false)
    if (error) return setIssue('We couldn’t save just now. Please try again.')
    await refreshFoods()
    onDone()
  }

  const num = (k: 'kcal_per_portion' | 'protein_g' | 'carbs_g' | 'fat_g', label: string) => (
    <Field id={k} label={label} error={errors[k]}>
      <Input id={k} inputMode="decimal" value={d[k]} onChange={set(k)} />
    </Field>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <Field id="emoji" label="Emoji" error={errors.emoji}>
          <Input id="emoji" value={d.emoji} onChange={set('emoji')} className="text-center text-xl" />
        </Field>
        <Field id="name" label="Name" error={errors.name}>
          <Input id="name" value={d.name} onChange={set('name')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id="food_group" label="Group">
          <Select id="food_group" value={d.food_group} onChange={set('food_group')}>
            {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </Select>
        </Field>
        <Field id="meal_slot" label="Suits">
          <Select id="meal_slot" value={d.meal_slot} onChange={set('meal_slot')}>
            {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field id="portion_description" label="One portion" error={errors.portion_description}>
        <Input id="portion_description" placeholder="e.g. 1 bowl (±200g)" value={d.portion_description} onChange={set('portion_description')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {num('kcal_per_portion', 'kcal')}
        {num('protein_g', 'Protein (g)')}
        {num('carbs_g', 'Carbs (g)')}
        {num('fat_g', 'Fat (g)')}
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">This food is notably…</legend>
        {([
          ['iron_rich', 'Iron-rich'],
          ['vitamin_c_rich', 'Rich in vitamin C'],
          ['high_satiety', 'Filling'],
        ] as const).map(([k, label]) => (
          <div key={k} className="flex items-center gap-3">
            <Checkbox id={k} checked={d[k]} onCheckedChange={(v) => setD({ ...d, [k]: v === true })} />
            <Label htmlFor={k} className="font-normal">{label}</Label>
          </div>
        ))}
      </fieldset>
      {issue && <p className="text-deep" role="status">{issue}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add to my food bank'}</Button>
    </form>
  )
}

export function FoodBank() {
  const { foods, refreshFoods } = useApp()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<FoodItem | null>(null)
  const [removing, setRemoving] = useState<FoodItem | null>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? foods.filter((f) => f.name.toLowerCase().includes(term)) : foods
  }, [foods, q])

  async function remove() {
    if (!removing) return
    await supabase.from('food_items').delete().eq('id', removing.id)
    setRemoving(null)
    await refreshFoods()
  }

  return (
    <AppShell>
      <h1 className="text-3xl">Food bank</h1>
      <p className="mt-1 text-muted">Everything your plate ideas are drawn from. Add your own favourites too.</p>

      <div className="mt-5 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="search" className="sr-only">Search foods</label>
          <input
            id="search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="min-h-11 w-full rounded-full border border-line bg-white/70 pr-4 pl-11 text-base text-deep"
          />
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus aria-hidden /> Add your own
        </Button>
      </div>

      <div className="mt-6 space-y-8">
        {GROUPS.map((g) => {
          const items = filtered.filter((f) => f.food_group === g.value)
          if (!items.length) return null
          return (
            <section key={g.value} aria-labelledby={`g-${g.value}`}>
              <h2 id={`g-${g.value}`} className="flex items-center gap-2 text-xl">
                <span aria-hidden>{g.emoji}</span> {g.label}
              </h2>
              <ul className="mt-3 space-y-2">
                {items.map((f) => (
                  <li key={f.id} className="flex items-start gap-3 rounded-2xl bg-white/60 p-4">
                    <span className="text-2xl leading-7" aria-hidden>{f.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-deep">
                        {f.name}
                        {f.is_custom && <span className="ml-2 text-xs font-normal text-muted">Yours</span>}
                      </p>
                      <p className="text-sm text-muted">{f.portion_description}</p>
                      <p className="num mt-1 text-sm text-deep">
                        {f.kcal_per_portion} kcal · P {f.protein_g} g · C {f.carbs_g} g · F {f.fat_g} g
                      </p>
                      {(f.iron_rich || f.high_satiety || f.vitamin_c_rich) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {f.iron_rich && <Marker icon={Droplet} label="Iron-rich" />}
                          {f.vitamin_c_rich && <Marker icon={Citrus} label="Vitamin C" />}
                          {f.high_satiety && <Marker icon={Soup} label="Filling" />}
                        </div>
                      )}
                    </div>
                    {f.is_custom && (
                      <div className="flex shrink-0">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${f.name}`} onClick={() => setEditing(f)}>
                          <Pencil aria-hidden />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Remove ${f.name}`} onClick={() => setRemoving(f)}>
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        {!filtered.length && <p className="text-muted">Nothing matches “{q}” yet — you can add it as your own.</p>}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent title="Add your own food">
          <ItemForm onDone={() => setAdding(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title="Edit your food">
          {editing && <ItemForm key={editing.id} initial={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent title={`Remove ${removing?.name ?? ''}?`} description="It will no longer appear in your food bank or plate ideas.">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRemoving(null)}>Keep it</Button>
            <Button className="flex-1" onClick={remove}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
