import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { DATA_STATEMENT } from '@/lib/copy'

export function DataDeleted() {
  const contact = DATA_STATEMENT.match(/contacting (.+)\.$/)?.[1] ?? 'the contact in the data statement'
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <Wordmark className="text-3xl" />
      <CheckCircle2 className="mt-8 size-10 text-olive" aria-hidden />
      <h1 className="mt-3 text-2xl">Your data has been deleted</h1>
      <p className="mt-3 text-deep">Your profile, cycle details and the foods you added are gone, and you’ve been signed out.</p>
      <p className="mt-3 text-deep">
        The email address you sign in with is kept separately. If you’d like that removed too, contact {contact} and it will be deleted.
      </p>
      <Link to="/login" className="mt-6 inline-flex min-h-11 items-center text-terracotta-dark underline underline-offset-4">Back to sign in</Link>
    </main>
  )
}
