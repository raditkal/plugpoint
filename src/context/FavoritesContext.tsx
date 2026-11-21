import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { getPlaces } from '../services/places'
import type { Place } from '../types/place'

interface FavoritesContextType {
  favorites: string[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (placeId: string) => Promise<void>
  favoritePlaces: Place[]
  isLoadingFavorites: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const storageKey = 'plugpoint_favorites_guest'

  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false)

  // ============================================================
  // Load favorites: dari Supabase kalau login, localStorage kalau guest
  // ============================================================
  useEffect(() => {
    if (user) {
      // User login → ambil dari Supabase
      loadFavoritesFromSupabase()
    } else {
      // Guest → ambil dari localStorage
      try {
        const saved = localStorage.getItem(storageKey)
        setFavorites(saved ? JSON.parse(saved) : [])
      } catch {
        setFavorites([])
      }
    }
  }, [user])

  const loadFavoritesFromSupabase = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('place_id')
        .eq('user_id', user.id)

      if (error) {
        console.warn('Gagal memuat favorit dari Supabase, fallback ke localStorage:', error.message)
        // Fallback: coba baca dari localStorage user-specific
        const saved = localStorage.getItem(`plugpoint_favorites_${user.id}`)
        setFavorites(saved ? JSON.parse(saved) : [])
        return
      }

      const ids = (data || []).map((row: { place_id: string }) => row.place_id)
      setFavorites(ids)
    } catch (err) {
      console.error('Error memuat favorit:', err)
      setFavorites([])
    }
  }

  // ============================================================
  // Simpan ke localStorage hanya untuk guest
  // ============================================================
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(favorites))
      } catch (e) {
        console.warn('Gagal menyimpan favorit ke localStorage:', e)
      }
    }
  }, [favorites, user])

  // ============================================================
  // Load detail tempat favorit untuk ditampilkan di My Places
  // ============================================================
  const refreshFavoritePlaces = useCallback(async () => {
    if (favorites.length === 0) {
      setFavoritePlaces([])
      return
    }

    setIsLoadingFavorites(true)
    try {
      const res = await getPlaces()
      const matched = res.data.filter((p) =>
        favorites.includes(p.id) || favorites.includes(p.id.split('-')[0])
      )
      setFavoritePlaces(matched)
    } catch (err) {
      console.error('Gagal memuat detail tempat favorit:', err)
    } finally {
      setIsLoadingFavorites(false)
    }
  }, [favorites])

  useEffect(() => {
    refreshFavoritePlaces()
  }, [refreshFavoritePlaces])

  // ============================================================
  // Helpers
  // ============================================================
  const isFavorite = useCallback(
    (id: string) => {
      const shortId = id.split('-')[0]
      return favorites.includes(id) || favorites.includes(shortId)
    },
    [favorites]
  )

  const toggleFavorite = useCallback(
    async (placeId: string) => {
      const isAlreadyFav = favorites.includes(placeId) || favorites.includes(placeId.split('-')[0])

      if (user) {
        // ---- User login: sync ke Supabase ----
        if (isAlreadyFav) {
          // Hapus dari Supabase
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('place_id', placeId)

          if (error) {
            console.error('Gagal menghapus favorit:', error.message)
            return
          }
          setFavorites((prev) => prev.filter((id) => id !== placeId && id !== placeId.split('-')[0]))
        } else {
          // Tambah ke Supabase
          const { error } = await supabase
            .from('favorites')
            .insert({ user_id: user.id, place_id: placeId } as any)

          if (error) {
            // Kalau conflict (sudah ada), bukan masalah besar
            if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
              console.error('Gagal menambah favorit:', error.message)
              return
            }
          }
          setFavorites((prev) => [...prev, placeId])
        }
      } else {
        // ---- Guest: hanya localStorage ----
        setFavorites((prev) => {
          const shortId = placeId.split('-')[0]
          const exists = prev.includes(placeId) || prev.includes(shortId)
          if (exists) {
            return prev.filter((id) => id !== placeId && id !== shortId)
          } else {
            return [...prev, placeId]
          }
        })
      }
    },
    [user, favorites]
  )

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        favoritePlaces,
        isLoadingFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export default FavoritesContext
