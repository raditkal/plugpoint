import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  isTrustedContributor: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Ambil data profil dari tabel public.profiles
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Gagal memuat profil pengguna:', error.message)
        return null
      }
      return data as Profile | null
    } catch (err) {
      console.error('Error saat fetchProfile:', err)
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    let isMounted = true

    // Periksa sesi aktif awal
    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Gagal membaca sesi Supabase:', error.message)
        }

        if (isMounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)

          if (initialSession?.user) {
            const userProfile = await fetchProfile(initialSession.user.id)
            if (isMounted) setProfile(userProfile)
          }
        }
      } catch (err) {
        console.error('Inisialisasi auth gagal:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    initAuth()

    // Dengarkan perubahan status login / logout secara realtime
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        const userProfile = await fetchProfile(newSession.user.id)
        if (isMounted) setProfile(userProfile)
      } else {
        if (isMounted) setProfile(null)
      }

      if (isMounted) setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Fungsi Masuk
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return { error }
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Terjadi kesalahan') }
    }
  }

  // Fungsi Daftar Akun Baru
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      })

      if (error) return { error }

      // Jika user langsung terkonfirmasi (misal email confirmation disabled di dev), set profil
      if (data.user) {
        const userProfile = await fetchProfile(data.user.id)
        setProfile(userProfile)
      }

      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Terjadi kesalahan') }
    }
  }

  // Fungsi Keluar
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }

  const isAdmin = profile?.is_admin === true
  const isTrustedContributor = profile?.contributor_status === 'trusted'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        isTrustedContributor,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

