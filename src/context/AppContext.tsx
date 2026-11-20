import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { FoodItem, MotivationalMessage, Profile } from '@/lib/types'

interface AppState {
  session: Session | null
  loading: boolean
  profile: Profile | null
  profileLoaded: boolean
  foods: FoodItem[]
  messages: MotivationalMessage[]
  refreshProfile: () => Promise<void>
  refreshFoods: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [messages, setMessages] = useState<MotivationalMessage[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
    setProfile(data ? ({ ...(data as Profile), weight_kg: Number((data as Profile).weight_kg) }) : null)
    setProfileLoaded(true)
  }, [userId])

  const refreshFoods = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('food_items').select('*').order('name')
    setFoods(((data as FoodItem[] | null) ?? []).map((f) => ({
      ...f,
      protein_g: Number(f.protein_g),
      carbs_g: Number(f.carbs_g),
      fat_g: Number(f.fat_g),
    })))
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setProfileLoaded(false)
      setFoods([])
      setMessages([])
      return
    }
    refreshProfile()
    refreshFoods()
    supabase
      .from('motivational_messages')
      .select('id, message_text, context_tag')
      .then(({ data }) => setMessages((data as MotivationalMessage[] | null) ?? []))
  }, [userId, refreshProfile, refreshFoods])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <Ctx.Provider
      value={{ session, loading, profile, profileLoaded, foods, messages, refreshProfile, refreshFoods, signOut }}
    >
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside AppProvider')
  return v
}
