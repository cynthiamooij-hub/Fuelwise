import type { FoodGroup, FoodItem } from './types'
import type { DailyFuel, Phase } from './nutrition'

export type PlateSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const SLOT_LABEL: Record<PlateSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

/** One row on the plate: "pick N of these". */
export interface PlateRow {
  prompt: string
  pick: number
  items: FoodItem[]
}

export interface SlotSuggestion {
  slot: PlateSlot
  rows: PlateRow[]
  approximate: boolean // a row could not be filled to three choices
}

type Emphasis = 'iron' | 'satiety' | null

export function emphasisFor(phase: Phase | null): Emphasis {
  if (phase === 'menstrual') return 'iron'
  if (phase === 'luteal') return 'satiety'
  return null
}

/** Small seeded PRNG (mulberry32) so a given seed gives stable suggestions. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CHOICES = 3

function suits(item: FoodItem, slots: PlateSlot[]) {
  return item.meal_slot === 'any' || (slots as string[]).includes(item.meal_slot)
}

/**
 * Pick up to `n` distinct items from `pool`, weighted toward items that score higher.
 * Falls back to `fallback` when the preferred pool is short, so a row is never empty.
 */
function choose(pool: FoodItem[], n: number, r: () => number, weight: (f: FoodItem) => number, fallback: FoodItem[] = []): FoodItem[] {
  const out: FoodItem[] = []
  const take = (from: FoodItem[]) => {
    const left = from.filter((f) => !out.includes(f))
    while (out.length < n && left.length) {
      const ws = left.map((f) => Math.max(0.05, weight(f)) * (0.5 + r()))
      const i = ws.indexOf(Math.max(...ws))
      out.push(left.splice(i, 1)[0])
    }
  }
  take(pool)
  take(fallback)
  return out
}

const group = (foods: FoodItem[], g: FoodGroup[]) => foods.filter((f) => g.includes(f.food_group))

export function suggestPlate(foods: FoodItem[], fuel: DailyFuel, phase: Phase | null, seed: number): SlotSuggestion[] {
  const emphasis = emphasisFor(phase)
  const vitC = foods.filter((f) => f.vitamin_c_rich)

  // Weighting: phase emphasis first, then lean toward protein for her goal's split.
  const proteinShare = (fuel.protein_g * 4) / Math.max(fuel.kcal, 1)
  const weight = (f: FoodItem) => {
    let w = 1
    if (emphasis === 'iron' && f.iron_rich) w += 1.5
    if (emphasis === 'satiety' && f.high_satiety) w += 1.5
    if (f.kcal_per_portion > 0) w += Math.min(1, ((f.protein_g * 4) / f.kcal_per_portion) * proteinShare * 4)
    return w
  }

  const make = (slot: PlateSlot, idx: number): SlotSuggestion => {
    const r = rng(seed * 31 + idx * 7919 + 1)
    const rows: PlateRow[] = []

    if (slot === 'breakfast') {
      // Substantial breakfast foods only — a spoon of seeds is not a breakfast on its own.
      const pool = group(foods, ['protein', 'carb']).filter((f) => suits(f, ['breakfast']) && f.kcal_per_portion >= 100)
      const main = choose(pool, CHOICES, r, weight, group(foods, ['protein', 'carb']))
      rows.push({ prompt: 'Pick one', pick: 1, items: main })
      if (emphasis === 'iron' && main.some((f) => f.iron_rich && !f.vitamin_c_rich)) {
        const fruit = vitC.filter((f) => f.food_group === 'fruit')
        rows.push({ prompt: 'With some vitamin C — pick one', pick: 1, items: choose(fruit, CHOICES, r, () => 1, vitC) })
      }
    }

    if (slot === 'lunch' || slot === 'dinner') {
      const slots: PlateSlot[] = [slot]
      const protein = group(foods, ['protein']).filter((f) => suits(f, slots))
      // Seed lunch carbs are few, so lunch may also draw on dinner carbs (rice, potatoes, …).
      const carbSlots: PlateSlot[] = slot === 'lunch' ? ['lunch', 'dinner'] : ['dinner']
      const carb = group(foods, ['carb']).filter((f) => suits(f, carbSlots))
      let veg = group(foods, ['vegetable']).filter((f) => suits(f, slot === 'lunch' ? ['lunch', 'dinner'] : ['dinner']))
      if (emphasis === 'iron') veg = veg.filter((f) => f.vitamin_c_rich) // any pick pairs iron with vitamin C
      rows.push({ prompt: 'Pick a protein', pick: 1, items: choose(protein, CHOICES, r, weight, group(foods, ['protein'])) })
      rows.push({ prompt: 'Add a carb', pick: 1, items: choose(carb, CHOICES, r, weight, group(foods, ['carb'])) })
      rows.push({
        prompt: 'And some veg',
        pick: 1,
        items: choose(veg, CHOICES, r, weight, emphasis === 'iron' ? vitC.filter((f) => f.food_group === 'vegetable') : group(foods, ['vegetable'])),
      })
    }

    if (slot === 'snack') {
      const snackPool = group(foods, ['snack', 'fruit', 'fat']).filter((f) => suits(f, ['snack']))
      const vitCFruit = vitC.filter((f) => f.food_group === 'fruit')
      if (emphasis === 'iron') {
        // One iron-rich snack and one vitamin C-rich partner, so the pair always matches.
        rows.push({ prompt: 'Pick one', pick: 1, items: choose(snackPool.filter((f) => f.iron_rich), CHOICES, r, weight, foods.filter((f) => f.iron_rich)) })
        rows.push({ prompt: 'And one with vitamin C', pick: 1, items: choose(vitCFruit, CHOICES, r, () => 1, vitC) })
      } else {
        const pool = emphasis === 'satiety' ? snackPool.filter((f) => f.high_satiety || f.protein_g >= 6) : snackPool
        rows.push({ prompt: 'Pick two', pick: 2, items: choose(pool, CHOICES, r, weight, snackPool) })
      }
    }

    return { slot, rows, approximate: rows.some((row) => row.items.length < CHOICES) }
  }

  return (['breakfast', 'lunch', 'dinner', 'snack'] as PlateSlot[]).map(make)
}

/**
 * Every combination a user can pick from a slot (one item per pick-1 row, any two from a pick-2 row).
 * Used to verify the iron + vitamin C pairing holds whatever she chooses.
 */
export function allCombinations(s: SlotSuggestion): FoodItem[][] {
  let combos: FoodItem[][] = [[]]
  for (const row of s.rows) {
    const picks: FoodItem[][] =
      row.pick === 1 ? row.items.map((i) => [i]) : row.items.flatMap((a, i) => row.items.slice(i + 1).map((b) => [a, b]))
    combos = combos.flatMap((c) => picks.map((p) => [...c, ...p]))
  }
  return combos
}

/** In the menstrual phase every meal with an iron-rich item must also carry a vitamin C-rich item. */
export function satisfiesIronPairing(items: FoodItem[]): boolean {
  return !items.some((i) => i.iron_rich) || items.some((i) => i.vitamin_c_rich)
}
