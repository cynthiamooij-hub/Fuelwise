import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { bmr, cycleState, dailyFuel, phaseForDay, validateAboutYou, type FuelInputs } from './nutrition'
import { allCombinations, satisfiesIronPairing, suggestPlate } from './suggestions'
import type { FoodItem } from './types'

function loadSeed(): FoodItem[] {
  const [head, ...rows] = readFileSync(new URL('../../docs/food-bank-seed.csv', import.meta.url), 'utf8').trim().split('\n')
  const cols = head.split(',')
  return rows.map((line, i) => {
    const v = line.split(',')
    const o: Record<string, string> = Object.fromEntries(cols.map((c, j) => [c, v[j]]))
    return {
      id: String(i),
      name: o.name,
      food_group: o.food_group,
      emoji: o.emoji,
      portion_description: o.portion_description,
      kcal_per_portion: Number(o.kcal_per_portion),
      protein_g: Number(o.protein_g),
      carbs_g: Number(o.carbs_g),
      fat_g: Number(o.fat_g),
      iron_rich: o.iron_rich === 'true',
      high_satiety: o.high_satiety === 'true',
      vitamin_c_rich: o.vitamin_c_rich === 'true',
      meal_slot: o.meal_slot,
      is_custom: false,
      owner_id: null,
    } as FoodItem
  })
}

const base: FuelInputs = { age: 35, height_cm: 168, weight_kg: 65, activity_level: 'moderate', goal: 'energy' }

describe('calories (criterion 3)', () => {
  it('BMR matches Mifflin-St Jeor female', () => {
    // 650 + 1050 − 175 − 161 = 1364
    expect(bmr(base)).toBe(1364)
  })
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 } as const
  const goal = { fat_loss: 0.85, muscle_gain: 1.1, energy: 1 } as const
  for (const [a, m] of Object.entries(mult)) {
    for (const [g, f] of Object.entries(goal)) {
      it(`${a} × ${g}`, () => {
        const expected = Math.max(1500, 1364 * m * f)
        const out = dailyFuel({ ...base, activity_level: a as FuelInputs['activity_level'], goal: g as FuelInputs['goal'] }, { training: false, luteal: false })
        expect(out.kcal).toBe(Math.round(expected))
      })
    }
  }
  it('worked example: moderate energy = 2114 kcal', () => {
    expect(dailyFuel(base, { training: false, luteal: false }).kcal).toBe(2114)
  })
})

describe('safety floor and protein (criteria 4, 5)', () => {
  const low: FuelInputs = { age: 70, height_cm: 150, weight_kg: 45, activity_level: 'sedentary', goal: 'fat_loss' }
  it('never below 1500', () => {
    // raw = (450 + 937.5 − 350 − 161) × 1.2 × 0.85 ≈ 894
    expect(dailyFuel(low, { training: false, luteal: false }).kcal).toBe(1500)
  })
  it('protein meets 1.6 g/kg', () => {
    expect(dailyFuel(low, { training: false, luteal: false }).protein_g).toBe(72)
  })
  it('calories rise rather than protein fall when protein + fat exceed the figure', () => {
    const heavy: FuelInputs = { age: 80, height_cm: 120, weight_kg: 250, activity_level: 'sedentary', goal: 'muscle_gain' }
    const out = dailyFuel(heavy, { training: false, luteal: false })
    expect(out.protein_g).toBe(450)
    expect(out.fat_g).toBe(225)
    expect(out.carbs_g).toBeGreaterThanOrEqual(0)
    expect(out.kcal).toBeGreaterThanOrEqual(450 * 4 + 225 * 9)
  })
})

describe('training and luteal (criteria 8, 9)', () => {
  it('training adds exactly 250', () => {
    const a = dailyFuel(base, { training: false, luteal: false }).kcal
    const b = dailyFuel(base, { training: true, luteal: false }).kcal
    expect(b - a).toBe(250)
  })
  it('luteal is exactly 5% more', () => {
    const a = dailyFuel(base, { training: false, luteal: false }).kcal
    const b = dailyFuel(base, { training: false, luteal: true }).kcal
    expect(b).toBe(Math.round(a * 1.05))
  })
})

describe('cycle phase (criterion 7)', () => {
  const p = { cycle_enabled: true, cycle_length_days: 28, period_length_days: 5, last_period_start: '2026-11-01' }
  it.each([
    ['2026-11-03', 3, 'menstrual'],
    ['2026-11-08', 8, 'follicular'],
    ['2026-11-13', 13, 'ovulatory'],
    ['2026-11-20', 20, 'luteal'],
  ])('%s → day %i %s', (today, day, phase) => {
    const s = cycleState(p, today)
    expect(s).toMatchObject({ kind: 'active', day, phase })
  })
  it('wraps into the next cycle', () => {
    expect(cycleState(p, '2026-11-29')).toMatchObject({ day: 1, phase: 'menstrual' })
  })
  it('luteal is the final 14 days', () => {
    expect(phaseForDay(14, 28, 5)).toBe('ovulatory')
    expect(phaseForDay(15, 28, 5)).toBe('luteal')
    expect(phaseForDay(28, 28, 5)).toBe('luteal')
  })
  it('off, stale and informational states', () => {
    expect(cycleState({ ...p, cycle_enabled: false }, '2026-11-03').kind).toBe('off')
    expect(cycleState({ ...p, last_period_start: null }, '2026-11-03').kind).toBe('stale')
    expect(cycleState(p, '2027-01-15').kind).toBe('stale') // > 60 days
    expect(cycleState({ ...p, cycle_length_days: 45 }, '2026-11-03').kind).toBe('informational')
  })
})

describe('validation (criterion 15 + ranges)', () => {
  it('flags under-18', () => {
    expect(validateAboutYou({ display_name: 'A', age: '17', height_cm: '160', weight_kg: '60' }).underAge).toBe(true)
  })
  it('flags implausible height/weight', () => {
    const r = validateAboutYou({ display_name: 'A', age: '30', height_cm: '230', weight_kg: '20' })
    expect(r.errors.height_cm).toBeTruthy()
    expect(r.errors.weight_kg).toBeTruthy()
  })
})

describe('suggestions (criteria 6, 10c)', () => {
  const foods = loadSeed()
  const fuel = dailyFuel(base, { training: false, luteal: false })
  it('loads 71 seed rows', () => expect(foods).toHaveLength(71))
  it('every row offers 2–3 choices, any phase, many seeds', () => {
    for (const phase of [null, 'menstrual', 'follicular', 'ovulatory', 'luteal'] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const s of suggestPlate(foods, fuel, phase, seed)) {
          expect(s.rows.length).toBeGreaterThan(0)
          for (const row of s.rows) {
            expect(row.items.length).toBeGreaterThanOrEqual(2)
            expect(row.items.length).toBeLessThanOrEqual(3)
            expect(new Set(row.items.map((i) => i.id)).size).toBe(row.items.length)
          }
        }
      }
    }
  })
  it('menstrual: whatever she picks, an iron-rich item comes with a vitamin C-rich item', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const s of suggestPlate(foods, fuel, 'menstrual', seed)) {
        for (const combo of allCombinations(s)) expect(satisfiesIronPairing(combo)).toBe(true)
      }
    }
  })
  it('menstrual plate leans iron-rich', () => {
    const s = suggestPlate(foods, fuel, 'menstrual', 3)
    const dinnerProteins = s.find((x) => x.slot === 'dinner')!.rows[0].items
    expect(dinnerProteins.some((i) => i.iron_rich)).toBe(true)
  })
  it('breakfast offers substantial single foods', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const b = suggestPlate(foods, fuel, null, seed)[0]
      expect(b.rows[0].pick).toBe(1)
      for (const i of b.rows[0].items) expect(i.kcal_per_portion).toBeGreaterThanOrEqual(100)
    }
  })
})
