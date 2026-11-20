import type { FoodGroup, FoodItem } from './types'
import type { DailyFuel, Phase } from './nutrition'

export type PlateSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const SLOT_SHARE: Record<PlateSlot, number> = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.3,
  snack: 0.15,
}

export const SLOT_LABEL: Record<PlateSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

export interface MealOption {
  items: FoodItem[]
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface SlotSuggestion {
  slot: PlateSlot
  options: MealOption[]
  approximate: boolean // true when nothing matched the macro target closely
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

/** Which food groups make up a meal in each slot. `optional` roles may be left empty. */
const ROLES: Record<PlateSlot, { group: FoodGroup[]; optional?: boolean }[]> = {
  breakfast: [{ group: ['protein'] }, { group: ['carb'] }, { group: ['fat', 'fruit'], optional: true }],
  lunch: [{ group: ['protein'] }, { group: ['carb'] }, { group: ['vegetable'] }],
  dinner: [{ group: ['protein'] }, { group: ['carb'] }, { group: ['vegetable'] }],
  snack: [{ group: ['snack', 'fruit', 'fat'] }, { group: ['fruit', 'snack'], optional: true }],
}

function fitsSlot(item: FoodItem, slot: PlateSlot, group: FoodGroup[]): boolean {
  if (!group.includes(item.food_group)) return false
  if (item.meal_slot === slot || item.meal_slot === 'any') return true
  // Fruit sits in the 'snack' slot in the seed data; it is also offered with breakfast.
  return slot === 'breakfast' && item.food_group === 'fruit'
}

function pick<T>(arr: T[], r: () => number): T | undefined {
  return arr.length ? arr[Math.floor(r() * arr.length)] : undefined
}

function total(items: FoodItem[]): MealOption {
  const sum = (k: 'kcal_per_portion' | 'protein_g' | 'carbs_g' | 'fat_g') =>
    items.reduce((s, i) => s + Number(i[k]), 0)
  return { items, kcal: sum('kcal_per_portion'), protein_g: sum('protein_g'), carbs_g: sum('carbs_g'), fat_g: sum('fat_g') }
}

/** In the menstrual phase every meal with an iron-rich item must also carry a vitamin C-rich item. */
export function satisfiesIronPairing(items: FoodItem[]): boolean {
  return !items.some((i) => i.iron_rich) || items.some((i) => i.vitamin_c_rich)
}

function buildCandidate(slot: PlateSlot, foods: FoodItem[], r: () => number, emphasis: Emphasis): FoodItem[] | null {
  const items: FoodItem[] = []
  for (const role of ROLES[slot]) {
    let pool = foods.filter((f) => fitsSlot(f, slot, role.group) && !items.includes(f))
    if (!pool.length) pool = foods.filter((f) => role.group.includes(f.food_group) && !items.includes(f))
    if (role.optional && r() < 0.4) continue
    // Lean the first pick toward the phase emphasis.
    if (items.length === 0 && emphasis) {
      const leaned = pool.filter((f) => (emphasis === 'iron' ? f.iron_rich : f.high_satiety))
      if (leaned.length && r() < 0.8) pool = leaned
    }
    const chosen = pick(pool, r)
    if (chosen) items.push(chosen)
  }
  if (!items.length) return null

  if (emphasis === 'iron' && !satisfiesIronPairing(items)) {
    // Add a vitamin C-rich partner that suits the slot, else any vitamin C-rich item.
    const partners = foods.filter((f) => f.vitamin_c_rich && !items.includes(f))
    const suited = partners.filter((f) => f.meal_slot === slot || f.meal_slot === 'any' || f.food_group === 'fruit' || f.food_group === 'vegetable')
    const partner = pick(suited.length ? suited : partners, r)
    if (!partner) return null
    items.push(partner)
  }
  return items
}

function score(opt: MealOption, target: { kcal: number; protein_g: number }, slot: PlateSlot, emphasis: Emphasis): number {
  let s = Math.abs(opt.kcal - target.kcal) / Math.max(target.kcal, 1)
  s += 0.6 * Math.max(0, (target.protein_g - opt.protein_g) / Math.max(target.protein_g, 1))
  if (emphasis === 'iron' && opt.items.some((i) => i.iron_rich)) s -= 0.25
  if (emphasis === 'satiety') {
    s -= 0.1 * opt.items.filter((i) => i.high_satiety).length
    if (slot === 'snack' && opt.protein_g >= 6) s -= 0.25
  }
  return s
}

export function suggestPlate(
  foods: FoodItem[],
  fuel: DailyFuel,
  phase: Phase | null,
  seed: number,
): SlotSuggestion[] {
  const emphasis = emphasisFor(phase)
  const slots: PlateSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
  return slots.map((slot, idx) => {
    const r = rng(seed * 31 + idx * 7919 + 1)
    const target = { kcal: fuel.kcal * SLOT_SHARE[slot], protein_g: fuel.protein_g * SLOT_SHARE[slot] }
    const seen = new Set<string>()
    const scored: { opt: MealOption; s: number }[] = []
    for (let n = 0; n < 250; n++) {
      const items = buildCandidate(slot, foods, r, emphasis)
      if (!items) continue
      const key = items.map((i) => i.id).sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const opt = total(items)
      scored.push({ opt, s: score(opt, target, slot, emphasis) + r() * 0.08 })
    }
    scored.sort((a, b) => a.s - b.s)

    // Take up to three, each led by a different first item so the options feel distinct.
    const options: MealOption[] = []
    const leads = new Set<string>()
    // Prefer options that share no items with ones already chosen, then relax.
    for (const maxShared of [0, 1]) {
      for (const { opt } of scored.slice(0, 60)) {
        if (options.length === 3) break
        if (options.includes(opt) || leads.has(opt.items[0].id)) continue
        const shared = opt.items.filter((i) => options.some((o) => o.items.includes(i))).length
        if (shared > maxShared) continue
        leads.add(opt.items[0].id)
        options.push(opt)
      }
    }
    for (const { opt } of scored) {
      if (options.length === 3) break
      if (leads.has(opt.items[0].id)) continue
      leads.add(opt.items[0].id)
      options.push(opt)
    }
    for (const { opt } of scored) {
      if (options.length >= 2) break
      if (!options.includes(opt)) options.push(opt)
    }
    // Last resort so a slot is never empty: single items from the slot.
    if (options.length < 2) {
      for (const f of foods) {
        if (options.length >= 2) break
        if (emphasis === 'iron' && f.iron_rich && !f.vitamin_c_rich) continue
        if (!options.some((o) => o.items.includes(f))) options.push(total([f]))
      }
    }
    const best = scored[0]?.s ?? Infinity
    return { slot, options, approximate: best > 0.35 }
  })
}
