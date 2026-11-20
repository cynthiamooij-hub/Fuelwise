import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BookOpen, Home, Settings, UtensilsCrossed } from 'lucide-react'
import { Wordmark } from './Wordmark'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/food', label: 'Food bank', icon: UtensilsCrossed },
  { to: '/recipes', label: 'Recipes', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-28">
      <header className="mx-auto flex max-w-2xl items-center px-4 pt-5">
        <Wordmark className="text-2xl" />
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
      {/* Bottom navigation: thumb-reachable on a phone */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-2xl justify-around">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-xs sm:text-sm',
                    isActive ? 'font-semibold text-terracotta-dark' : 'text-muted',
                  )
                }
              >
                <Icon className="size-6" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
