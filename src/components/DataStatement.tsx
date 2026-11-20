import { ShieldCheck } from 'lucide-react'
import { DATA_STATEMENT } from '@/lib/copy'

export function DataStatement() {
  return (
    <div className="flex gap-3 rounded-2xl bg-fill p-4 text-sm text-deep">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-olive" aria-hidden />
      <div>
        <p className="font-medium">How your data is used</p>
        <p className="mt-1">{DATA_STATEMENT}</p>
        <p className="mt-2 text-xs text-muted">Draft wording — to be finalised before wider use.</p>
      </div>
    </div>
  )
}
