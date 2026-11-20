import { useState } from 'react'
import { Mail, MailCheck } from 'lucide-react'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { TAGLINE } from '@/lib/copy'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Login({ notice }: { notice?: string }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    // shouldCreateUser:false — invited users only. We show the same message either way
    // so the form never reveals who has an account.
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    setSent(true)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Wordmark className="text-5xl" />
      <p className="mt-2 font-serif text-xl text-terracotta-dark">{TAGLINE}</p>

      {notice && <p className="mt-6 rounded-2xl bg-fill p-4 text-deep" role="status">{notice}</p>}

      {sent ? (
        <div className="mt-10 rounded-3xl bg-fill p-6" role="status">
          <MailCheck className="size-8 text-olive" aria-hidden />
          <h1 className="mt-3 text-2xl">Check your inbox</h1>
          <p className="mt-2 text-deep">
            If <span className="font-medium">{email}</span> has been invited to Fuelwise, a sign-in link is on its way. Open it on this device.
          </p>
          <Button variant="ghost" className="mt-4 -ml-3" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-4">
          <h1 className="text-2xl">Sign in</h1>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !supabaseConfigured}>
            <Mail aria-hidden /> {busy ? 'Sending…' : 'Send me a link'}
          </Button>
          <p className="text-sm text-muted">We’ll email you a sign-in link — no password needed.</p>
          {!supabaseConfigured && (
            <p className="text-sm text-muted">This copy of the app isn’t connected to its database yet.</p>
          )}
        </form>
      )}
    </main>
  )
}
