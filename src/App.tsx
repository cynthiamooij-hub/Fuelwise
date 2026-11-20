import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import { PlateProvider } from '@/context/PlateContext'
import { Login } from '@/pages/Login'
import { Onboarding } from '@/pages/Onboarding'
import { Dashboard } from '@/pages/Dashboard'
import { FoodBank } from '@/pages/FoodBank'
import { Settings } from '@/pages/Settings'
import { Privacy } from '@/pages/Privacy'
import { DataDeleted } from '@/pages/DataDeleted'
import { Recipes } from '@/pages/Recipes'

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
      Loading…
    </div>
  )
}

/** Signed in + profile complete, else route to login or onboarding. */
function Guard({ children, needsProfile = true }: { children: ReactNode; needsProfile?: boolean }) {
  const { session, loading, profile, profileLoaded } = useApp()
  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  if (!profileLoaded) return <Loading />
  if (needsProfile && !profile) return <Navigate to="/onboarding" replace />
  if (!needsProfile && profile) return <Navigate to="/" replace />
  return <>{children}</>
}

function LoginRoute() {
  const { session, loading } = useApp()
  if (loading) return <Loading />
  if (session) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AppProvider>
      <PlateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/data-deleted" element={<DataDeleted />} />
          <Route path="/onboarding" element={<Guard needsProfile={false}><Onboarding /></Guard>} />
          <Route path="/" element={<Guard><Dashboard /></Guard>} />
          <Route path="/food" element={<Guard><FoodBank /></Guard>} />
          <Route path="/recipes" element={<Guard><Recipes /></Guard>} />
          <Route path="/settings" element={<Guard><Settings /></Guard>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </PlateProvider>
    </AppProvider>
  )
}
