import { ExternalLink } from 'lucide-react'
import { usePlate } from '@/context/PlateContext'
import { RECIPES_INTRO } from '@/lib/copy'
import type { FoodItem } from '@/lib/types'
import { AppShell } from '@/components/AppShell'

/** Only the food name goes into the search — never anything about the user. */
export function recipeSearchUrl(food: FoodItem) {
  return `https://www.google.com/search?q=${encodeURIComponent(`healthy ${food.name.toLowerCase()} recipe`)}`
}

export function Recipes() {
  const { plate } = usePlate()
  const proteins: FoodItem[] = []
  for (const slot of plate.filter((s) => s.slot === 'lunch' || s.slot === 'dinner')) {
    for (const item of slot.rows[0]?.items ?? []) if (!proteins.some((p) => p.id === item.id)) proteins.push(item)
  }

  return (
    <AppShell>
      <h1 className="text-3xl">Recipe ideas</h1>
      <p className="mt-2 text-deep">{RECIPES_INTRO}</p>

      <ul className="mt-6 space-y-2">
        {proteins.map((p) => (
          <li key={p.id}>
            <a
              href={recipeSearchUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 hover:bg-fill"
            >
              <span className="text-2xl" aria-hidden>{p.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-deep">{p.name}</span>
                <span className="block text-sm text-terracotta-dark">Find recipes</span>
              </span>
              <ExternalLink className="size-5 shrink-0 text-muted" aria-hidden />
              <span className="sr-only">(opens a web search in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">
        These follow the proteins on today’s lunch and dinner. Tap “New ideas” on a meal for different ones.
      </p>
    </AppShell>
  )
}
