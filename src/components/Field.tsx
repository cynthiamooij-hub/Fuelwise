import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { Label } from './ui/label'

/** Label + control + gentle inline hint. No red: hints use deep text with an info icon. */
export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="flex items-start gap-1.5 text-sm text-deep" role="status">
          <Info className="mt-0.5 size-4 shrink-0 text-terracotta-dark" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
