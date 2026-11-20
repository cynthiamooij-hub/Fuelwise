import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DataStatement } from '@/components/DataStatement'
import { Wordmark } from '@/components/Wordmark'

export function Privacy() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <Link to="/settings" className="-ml-2 inline-flex min-h-11 items-center gap-2 px-2 text-deep">
        <ArrowLeft className="size-5" aria-hidden /> Back
      </Link>
      <Wordmark className="mt-4 block text-2xl" />
      <h1 className="mt-4 text-3xl">How your data is used</h1>
      <div className="mt-6"><DataStatement /></div>
      <div className="mt-6 space-y-3 text-deep">
        <p><span className="font-medium">What we store:</span> your first name, email address, age, height, weight, activity level and goal — and, only if you switch cycle guidance on, your typical cycle length, period length and the start date of your last period.</p>
        <p><span className="font-medium">Where:</span> in a database hosted in Frankfurt, in the EU. Only you can read your data.</p>
        <p><span className="font-medium">What we never store:</span> your daily figures, plate ideas or training days. These are worked out fresh each time.</p>
        <p><span className="font-medium">Your choices:</span> switching cycle guidance off deletes your cycle details. “Delete all my data” in Settings removes everything else.</p>
      </div>
    </main>
  )
}
