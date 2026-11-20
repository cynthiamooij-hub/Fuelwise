import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronDown, Dumbbell, Lightbulb, RefreshCw } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cycleState, dailyFuel, daysBetween, localISODate, type Phase } from '@/lib/nutrition'
import { SLOT_LABEL, suggestPlate, type PlateRow } from '@/lib/suggestions'
import { APPROXIMATE_LINE, ESTIMATE_NOTE, GOAL_WHY, PHASE_WHY, TRAINING_WHY } from '@/lib/copy'
import type { ContextTag, FoodItem, MotivationalMessage } from '@/lib/types'
import { AppShell } from '@/components/AppShell'
import { CycleStrip } from '@/components/CycleStrip'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

function daySeed(today: string) {
  return daysBetween('2026-01-01', today)
}

function greetingWord() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 18) return 'Afternoon'
  return 'Evening'
}

function chooseMessage(messages: MotivationalMessage[], tags: ContextTag[], seed: number): string | null {
  for (const tag of tags) {
    const pool = messages.filter((m) => m.context_tag === tag)
    if (pool.length) return pool[seed % pool.length].message_text
  }
  return null
}

function Row({ row }: { row: PlateRow }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted">{row.prompt}</p>
      <ul className="mt-1.5 divide-y divide-line rounded-2xl bg-white/70">
        {row.items.map((i) => (
          <li key={i.id} className="flex items-start gap-3 px-4 py-2.5">
            <span className="text-2xl leading-7" aria-hidden>{i.emoji}</span>
            <span className="min-w-0">
              <span className="block font-medium text-deep">{i.name}</span>
              <span className="block text-sm text-muted">{i.portion_description}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function findFood(foods: FoodItem[], name: string) {
  return foods.find((f) => f.name === name)
}

export function Dashboard() {
  const { profile, foods, messages } = useApp()
  const today = localISODate()
  const [training, setTraining] = useState(false) // never stored, so it is off on every load
  const [seed, setSeed] = useState(() => daySeed(today))
  const [whyOpen, setWhyOpen] = useState(false)

  const cycle = profile ? cycleState(profile, today) : { kind: 'off' as const }
  const phase: Phase | null = cycle.kind === 'active' ? cycle.phase : null

  const fuel = useMemo(
    () => (profile ? dailyFuel(profile, { training, luteal: phase === 'luteal' }) : null),
    [profile, training, phase],
  )
  const plate = useMemo(() => (fuel && foods.length ? suggestPlate(foods, fuel, phase, seed) : []), [foods, fuel, phase, seed])

  if (!profile || !fuel) return null

  const returning = profile.created_at.slice(0, 10) < today
  const messageTags: ContextTag[] = [
    ...(training ? (['training_day'] as const) : []),
    ...(phase ? [phase] : []),
    ...(returning ? (['returning_user', 'general'] as const) : (['general'] as const)),
  ]
  const message = chooseMessage(messages, messageTags, daySeed(today))

  const pre = [findFood(foods, 'Banana'), findFood(foods, 'Oats')].filter(Boolean) as FoodItem[]
  const post = [
    [findFood(foods, 'Skyr'), findFood(foods, 'Blueberries')],
    [findFood(foods, 'Chicken breast'), findFood(foods, 'Brown rice')],
  ].filter((pair) => pair.every(Boolean)) as FoodItem[][]

  return (
    <AppShell>
      <section aria-labelledby="greeting">
        <h1 id="greeting" className="text-3xl sm:text-4xl">
          {greetingWord()}, {profile.display_name}
        </h1>
        {message && <p className="mt-2 text-lg text-deep">{message}</p>}
      </section>

      {(cycle.kind === 'active' || cycle.kind === 'informational') && (
        <div className="mt-6">
          <CycleStrip state={cycle} />
        </div>
      )}
      {cycle.kind === 'stale' && (
        <Link
          to="/settings#cycle"
          className="mt-6 flex min-h-11 items-center gap-3 rounded-2xl bg-fill px-4 py-3 text-deep hover:bg-line"
        >
          <CalendarClock className="size-5 text-terracotta-dark" aria-hidden />
          Update your cycle dates
        </Link>
      )}

      <Card className="mt-6" aria-labelledby="fuel-heading">
        <h2 id="fuel-heading" className="text-xl">Today’s fuel</h2>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
          <span className="num text-5xl font-semibold text-deep">{fuel.kcal.toLocaleString('en-GB')}</span>
          <span className="num text-lg text-muted">kcal, roughly</span>
        </p>
        <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-3">
          {[
            ['Protein', fuel.protein_g],
            ['Carbs', fuel.carbs_g],
            ['Fat', fuel.fat_g],
          ].map(([label, g]) => (
            <div key={label} className="rounded-2xl bg-fill p-3">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="num text-2xl font-semibold text-deep">{g} g</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted">{ESTIMATE_NOTE}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-4">
          <Label htmlFor="training" className="flex items-center gap-2 text-base">
            <Dumbbell className="size-5 text-olive" aria-hidden /> Training today?
          </Label>
          <Switch id="training" checked={training} onCheckedChange={setTraining} />
        </div>
        {training && (
          <div className="mt-3 space-y-2 rounded-2xl bg-fill p-4 text-deep">
            <p>
              <span className="font-medium">Before: </span>
              {pre.length ? pre.map((f) => `${f.emoji} ${f.name.toLowerCase()}`).join(' or ') : 'a banana or a bowl of oats'}
              {' '}for quick, easy energy.
            </p>
            <p>
              <span className="font-medium">After: </span>
              {post.length
                ? post.map((pair) => pair.map((f) => `${f.emoji} ${f.name.toLowerCase()}`).join(' with ')).join(', or ')
                : 'some protein with carbs'}
              {' '}— protein plus carbs to help you recover.
            </p>
          </div>
        )}
      </Card>

      <section className="mt-8" aria-labelledby="plate-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="plate-heading" className="text-2xl">Today’s plate</h2>
          <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>
            <RefreshCw aria-hidden /> New ideas
          </Button>
        </div>
        <p className="mt-1 text-muted">Ideas for each meal — choose whatever appeals today.</p>

        <div className="mt-4 space-y-6">
          {plate.map((s) => (
            <div key={s.slot}>
              <h3 className="text-lg">{SLOT_LABEL[s.slot]}</h3>
              <div className="mt-2 space-y-3">
                {s.rows.map((row) => (
                  <Row key={row.prompt} row={row} />
                ))}
              </div>
              {s.approximate && <p className="mt-2 text-sm text-muted">{APPROXIMATE_LINE}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <button
          className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-fill px-4 py-3 text-left"
          aria-expanded={whyOpen}
          aria-controls="why-body"
          onClick={() => setWhyOpen((v) => !v)}
        >
          <span className="flex items-center gap-2 font-serif text-lg text-deep">
            <Lightbulb className="size-5 text-olive" aria-hidden /> Why this?
          </span>
          <ChevronDown className={`size-5 transition-transform ${whyOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {whyOpen && (
          <div id="why-body" className="space-y-3 px-4 pt-3 text-deep">
            <p>{GOAL_WHY[profile.goal]}</p>
            {phase && <p>{PHASE_WHY[phase]}</p>}
            {training && <p>{TRAINING_WHY}</p>}
            <p>Lunch and dinner are built from a protein, a carb and some veg, so you get staying power, energy and fibre together. Tap “New ideas” any time for different choices.</p>
          </div>
        )}
      </section>
    </AppShell>
  )
}
