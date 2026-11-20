import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useApp } from './AppContext'
import { cycleState, dailyFuel, daysBetween, localISODate, type CycleState, type DailyFuel, type Phase } from '@/lib/nutrition'
import { suggestPlate, type PlateSlot, type SlotSeeds, type SlotSuggestion } from '@/lib/suggestions'

/**
 * Today's plate, shared by the dashboard and the recipes tab.
 * Held in memory only: nothing here is stored, and it all resets on reload.
 */
interface PlateState {
  today: string
  daySeed: number
  cycle: CycleState
  phase: Phase | null
  training: boolean
  setTraining: (v: boolean) => void
  fuel: DailyFuel | null
  plate: SlotSuggestion[]
  refresh: (slot: PlateSlot) => void
}

const Ctx = createContext<PlateState | null>(null)

export function PlateProvider({ children }: { children: ReactNode }) {
  const { profile, foods } = useApp()
  const today = localISODate()
  const daySeed = daysBetween('2026-01-01', today)
  const [training, setTraining] = useState(false)
  const [seeds, setSeeds] = useState<SlotSeeds>({ breakfast: daySeed, lunch: daySeed, dinner: daySeed, snack: daySeed })
  const refresh = (slot: PlateSlot) => setSeeds((s) => ({ ...s, [slot]: s[slot] + 1 }))

  const cycle: CycleState = profile ? cycleState(profile, today) : { kind: 'off' }
  const phase: Phase | null = cycle.kind === 'active' ? cycle.phase : null
  const fuel = useMemo(
    () => (profile ? dailyFuel(profile, { training, luteal: phase === 'luteal' }) : null),
    [profile, training, phase],
  )
  const plate = useMemo(() => (fuel && foods.length ? suggestPlate(foods, fuel, phase, seeds) : []), [foods, fuel, phase, seeds])

  return (
    <Ctx.Provider value={{ today, daySeed, cycle, phase, training, setTraining, fuel, plate, refresh }}>{children}</Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlate() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePlate outside PlateProvider')
  return v
}
