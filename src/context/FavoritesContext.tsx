import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, User } from 'lucide-react'
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
  const navigate = useNavigate()

  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)

  // ============================================================
  // Load favorites: hanya untuk user yang terotentikasi (login)
  // Guest / unauthorized user tidak memiliki favorit
  // ============================================================
  useEffect(() => {
    if (user) {
      loadFavoritesFromSupabase()
    } else {
      setFavorites([])
      setFavoritePlaces([])
      // Bersihkan residual guest storage jika ada
      try {
        localStorage.removeItem('plugpoint_favorites_guest')
      } catch {
        // ignore
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
        console.warn('Gagal memuat favorit dari Supabase:', error.message)
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
  // Load detail tempat favorit untuk ditampilkan di My Places
  // ============================================================
  const refreshFavoritePlaces = useCallback(async () => {
    if (!user || favorites.length === 0) {
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
  }, [user, favorites])

  useEffect(() => {
    refreshFavoritePlaces()
  }, [refreshFavoritePlaces])

  // ============================================================
  // Helpers
  // ============================================================
  const isFavorite = useCallback(
    (id: string) => {
      if (!user) return false
      const shortId = id.split('-')[0]
      return favorites.includes(id) || favorites.includes(shortId)
    },
    [user, favorites]
  )

  const toggleFavorite = useCallback(
    async (placeId: string) => {
      // Jika user belum login (unauthorized), tolak aksi dan tampilkan modal login
      if (!user) {
        setShowAuthModal(true)
        return
      }

      const isAlreadyFav = favorites.includes(placeId) || favorites.includes(placeId.split('-')[0])

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
          if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
            console.error('Gagal menambah favorit:', error.message)
            return
          }
        }
        setFavorites((prev) => [...prev, placeId])
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

      {/* Modal Prompt Login saat User Unauthorized ingin menyimpan favorit */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#EAE0D2] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
              <Heart className="w-7 h-7 fill-rose-500" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#2D231E]">
                Masuk untuk Menyimpan Favorit
              </h3>
              <p className="text-xs text-[#7A6B63] leading-relaxed">
                Kamu perlu masuk ke akun terlebih dahulu untuk menyimpan tempat kerja dan kafe ini ke daftar favoritmu.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false)
                  navigate('/login')
                }}
                className="w-full py-2.5 px-4 rounded-full bg-[#382E2B] hover:bg-[#201815] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-[#F4CDBE]" />
                <span>Masuk ke Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false)
                  navigate('/register')
                }}
                className="w-full py-2.5 px-4 rounded-full bg-[#FAF2EB] hover:bg-[#F3E2D5] text-[#7A4B3A] text-xs font-bold transition-colors border border-[#F0D5C3] cursor-pointer"
              >
                <span>Daftar Akun Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-1.5 text-xs font-bold text-[#A6978C] hover:text-[#2D231E] transition-colors cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
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
