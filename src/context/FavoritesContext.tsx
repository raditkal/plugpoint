import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getPlaces } from '../services/places'
import type { Place } from '../types/place'

interface FavoritesContextType {
  favorites: string[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (placeId: string) => void
  favoritePlaces: Place[]
  isLoadingFavorites: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const storageKey = user ? `plugpoint_favorites_${user.id}` : 'plugpoint_favorites_guest'

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false)

  // Muat data favorit ketika user berubah
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      setFavorites(saved ? JSON.parse(saved) : [])
    } catch {
      setFavorites([])
    }
  }, [storageKey])

  // Simpan ke localStorage setiap kali ada perubahan
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites))
    } catch (e) {
      console.warn('Gagal menyimpan favorit ke localStorage:', e)
    }
  }, [favorites, storageKey])

  // Muat detail tempat favorit
  const refreshFavoritePlaces = useCallback(async () => {
    if (favorites.length === 0) {
      setFavoritePlaces([])
      return
    }

    setIsLoadingFavorites(true)
    try {
      // Ambil seluruh tempat yang disetujui (Supabase / Fallback)
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

  const isFavorite = useCallback(
    (id: string) => {
      const shortId = id.split('-')[0]
      return favorites.includes(id) || favorites.includes(shortId)
    },
    [favorites]
  )

  const toggleFavorite = useCallback(
    (placeId: string) => {
      setFavorites((prev) => {
        const shortId = placeId.split('-')[0]
        const exists = prev.includes(placeId) || prev.includes(shortId)

        if (exists) {
          return prev.filter((id) => id !== placeId && id !== shortId)
        } else {
          return [...prev, placeId]
        }
      })
    },
    []
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
