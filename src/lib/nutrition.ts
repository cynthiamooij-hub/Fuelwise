import type { ActivityLevel, Goal, Profile } from './types'

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}

export const GOAL_FACTOR: Record<Goal, number> = {
  fat_loss: 0.85,
  muscle_gain: 1.1,
  energy: 1.0,
}

/** grams per kg bodyweight — both are floors, never reduced */
export const MACRO_PER_KG: Record<Goal, { protein: number; fat: number }> = {
  fat_loss: { protein: 1.6, fat: 0.8 },
  muscle_gain: { protein: 1.8, fat: 0.9 },
  energy: { protein: 1.4, fat: 0.9 },
}

export const TRAINING_KCAL = 250
export const LUTEAL_FACTOR = 1.05 // hard cap — never more than 5%
export const CALORIE_FLOOR = 1500

export const LIMITS = {
  minAge: 18,
  weight: { min: 35, max: 250 },
  height: { min: 120, max: 220 },
  cycleLength: { min: 21, max: 40 },
  staleDays: 60,
}

export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

export type CycleState =
  | { kind: 'off' }
  | { kind: 'stale' } // dates missing or > 60 days old: quiet prompt, no phase
  | { kind: 'informational'; day: number; cycleLength: number; periodLength: number } // length outside 21–40
  | { kind: 'active'; day: number; cycleLength: number; periodLength: number; phase: Phase }

/** Whole days between two YYYY-MM-DD dates (b − a), timezone-safe. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

/** Today's local date as YYYY-MM-DD. */
export function localISODate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Phase boundaries for a cycle of length L and period length P:
 *  menstrual  1..P
 *  luteal     final 14 days: (L−13)..L
 *  ovulatory  the 3 days ending at L−14: (L−16)..(L−14)
 *  follicular everything else after the period
 * Menstrual takes precedence if a long period overlaps a later range.
 */
export function phaseForDay(day: number, cycleLength: number, periodLength: number): Phase {
  if (day <= periodLength) return 'menstrual'
  if (day >= cycleLength - 13) return 'luteal'
  if (day >= cycleLength - 16) return 'ovulatory'
  return 'follicular'
}

export function cycleState(
  p: Pick<Profile, 'cycle_enabled' | 'cycle_length_days' | 'period_length_days' | 'last_period_start'>,
  today: string,
): CycleState {
  if (!p.cycle_enabled) return { kind: 'off' }
  const L = p.cycle_length_days
  const P = p.period_length_days
  if (!p.last_period_start || !L || !P) return { kind: 'stale' }
  const since = daysBetween(p.last_period_start, today)
  if (since < 0 || since > LIMITS.staleDays) return { kind: 'stale' }
  const day = (since % L) + 1
  if (L < LIMITS.cycleLength.min || L > LIMITS.cycleLength.max) {
    return { kind: 'informational', day, cycleLength: L, periodLength: P }
  }
  return { kind: 'active', day, cycleLength: L, periodLength: P, phase: phaseForDay(day, L, P) }
}

export interface DailyFuel {
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export interface FuelInputs {
  age: number
  height_cm: number
  weight_kg: number
  activity_level: ActivityLevel
  goal: Goal
}

export function bmr({ weight_kg, height_cm, age }: Pick<FuelInputs, 'weight_kg' | 'height_cm' | 'age'>): number {
  return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
}

/**
 * Steps 1–7 of spec Section 9. Returns rounded display figures.
 * Order: BMR → activity → goal → +training → ×1.05 luteal → 1,500 floor → macros.
 * Protein and fat are floors; carbs take the remainder. If protein + fat exceed
 * the calorie figure, carbs go to 0 and the calorie figure rises — protein never falls.
 */
export function dailyFuel(input: FuelInputs, opts: { training: boolean; luteal: boolean }): DailyFuel {
  let kcal = bmr(input) * ACTIVITY_MULTIPLIER[input.activity_level]
  kcal *= GOAL_FACTOR[input.goal]
  if (opts.training) kcal += TRAINING_KCAL
  if (opts.luteal) kcal *= LUTEAL_FACTOR
  kcal = Math.max(kcal, CALORIE_FLOOR)

  const per = MACRO_PER_KG[input.goal]
  const protein = per.protein * input.weight_kg
  const fat = per.fat * input.weight_kg
  const fixedKcal = protein * 4 + fat * 9
  if (fixedKcal > kcal) kcal = fixedKcal
  const carbs = (kcal - fixedKcal) / 4

  return {
    kcal: Math.round(kcal),
    protein_g: Math.round(protein),
    fat_g: Math.round(fat),
    carbs_g: Math.round(carbs),
  }
}

export type FieldErrors = Partial<Record<'display_name' | 'age' | 'height_cm' | 'weight_kg', string>>

export function validateAboutYou(v: {
  display_name: string
  age: string
  height_cm: string
  weight_kg: string
}): { errors: FieldErrors; underAge: boolean } {
  const errors: FieldErrors = {}
  let underAge = false
  if (!v.display_name.trim()) errors.display_name = 'Add the name you’d like us to use.'
  const age = Number(v.age)
  if (!v.age || !Number.isInteger(age) || age < 1 || age > 120) errors.age = 'Please enter your age in whole years.'
  else if (age < LIMITS.minAge) underAge = true
  const h = Number(v.height_cm)
  if (!v.height_cm || !Number.isFinite(h) || h < LIMITS.height.min || h > LIMITS.height.max)
    errors.height_cm = `Could you check this? We work with heights from ${LIMITS.height.min} to ${LIMITS.height.max} cm.`
  const w = Number(v.weight_kg)
  if (!v.weight_kg || !Number.isFinite(w) || w < LIMITS.weight.min || w > LIMITS.weight.max)
    errors.weight_kg = `Could you check this? We work with weights from ${LIMITS.weight.min} to ${LIMITS.weight.max} kg.`
  return { errors, underAge }
}
