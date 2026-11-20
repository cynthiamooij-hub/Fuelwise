import { CalendarHeart } from 'lucide-react'
import type { CycleState, Phase } from '@/lib/nutrition'
import { PHASE_LINE, PHASE_NAME } from '@/lib/copy'

const PHASE_COLOUR: Record<Phase, string> = {
  menstrual: '#D85A30',
  follicular: '#E9B8A4',
  ovulatory: '#3B6D11',
  luteal: '#C98A5E',
}

function segments(L: number, P: number) {
  return [
    { phase: 'menstrual' as const, from: 1, to: P },
    { phase: 'follicular' as const, from: P + 1, to: L - 17 },
    { phase: 'ovulatory' as const, from: Math.max(P + 1, L - 16), to: L - 14 },
    { phase: 'luteal' as const, from: L - 13, to: L },
  ].filter((s) => s.to >= s.from)
}

export function CycleStrip({ state }: { state: Extract<CycleState, { kind: 'active' | 'informational' }> }) {
  const { day, cycleLength: L, periodLength: P } = state
  const active = state.kind === 'active'
  const pct = ((day - 0.5) / L) * 100
  return (
    <section aria-label="Your cycle" className="rounded-3xl bg-fill p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <CalendarHeart className="size-5 text-terracotta-dark" aria-hidden />
        <span className="num">Day {day} of {L}</span>
      </div>
      <p className="mt-1 font-serif text-xl text-deep">{active ? PHASE_NAME[state.phase] : 'Your cycle'}</p>

      <div className="relative mt-4 pt-3" aria-hidden>
        <div className="flex h-3 overflow-hidden rounded-full bg-line">
          {active &&
            segments(L, P).map((s) => (
              <div key={s.phase} style={{ width: `${((s.to - s.from + 1) / L) * 100}%`, background: PHASE_COLOUR[s.phase] }} />
            ))}
        </div>
        <div
          className="absolute top-0 size-6 -translate-x-1/2 rounded-full border-4 border-surface bg-deep shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      {active && (
        <div className="mt-2 flex justify-between text-xs text-muted" aria-hidden>
          <span>Period</span>
          <span>Ovulation</span>
          <span>Luteal</span>
        </div>
      )}
      <p className="mt-3 text-sm text-deep">
        {active
          ? PHASE_LINE[state.phase]
          : 'Your cycle length sits outside the range the phase model works well for, so your plate follows your goal without cycle adjustments.'}
      </p>
    </section>
  )
}
