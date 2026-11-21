import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, User, Coffee, LogOut, ShieldCheck, ChevronDown, CheckCircle, MapPin, Clock3, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, isTrustedContributor, signOut } = useAuth()
  const { favorites } = useFavorites()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
    navigate('/')
  }

  // Ambil nama tampilan pengguna
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Pengguna'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#EFE7DE] bg-[#FAF6F0]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo - Cute & Warm Cafe Aesthetic */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#E8DFD3] border border-[#D9CDBF] flex items-center justify-center text-[#6B5344] shadow-sm group-hover:rotate-6 transition-transform">
            <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-[#8C6D58]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#2D231E]">
                plugpoint<span className="text-[#C86D51]">.</span>
              </span>
            </div>
          </div>
        </Link>

        {/* Action Buttons - Rounded & Playful */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Tombol Rekomendasikan Tempat */}
          <Link
            to="/add-place"
            className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#4A3B32] bg-[#F2ECE3] hover:bg-[#E8DFD3] border border-[#DFD3C3] rounded-full transition-all active:scale-95 shadow-2xs"
            title="Tambah Tempat Baru"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C86D51]" />
            <span className="hidden sm:inline">Rekomendasikan Tempat</span>
            <span className="sm:hidden text-xs">Tambah</span>
          </Link>

          {/* Tombol Tempat Saya (jika user login) */}
          {user && (
            <Link
              to="/my-places"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#4A3B32] bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#DFD3C3] rounded-full transition-all active:scale-95 shadow-2xs"
              title="Lihat Tempat Kontribusi & Favorit Saya"
            >
              <Clock3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C86D51]" />
              <span className="hidden md:inline">Tempat Saya</span>
              <span className="md:hidden hidden xs:inline">Saya</span>
            </Link>
          )}

          {/* Tombol Favorit (untuk Tamu / Guest jika menyimpan favorit) */}
          {!user && (
            <Link
              to="/my-places?tab=favorites"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#4A3B32] bg-white hover:bg-[#FAF7F2] border border-[#DFD3C3] rounded-full transition-all active:scale-95 shadow-2xs"
              title="Tempat Favorit Saya"
            >
              <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-[#8C7A70]'}`} />
              <span className="hidden sm:inline">Favorit</span>
              {favorites.length > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-50 text-rose-600 font-extrabold text-[10px] flex items-center justify-center border border-rose-200">
                  {favorites.length}
                </span>
              )}
            </Link>
          )}

          {/* User Section: Login vs Authenticated Menu */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#2D231E] bg-white hover:bg-[#F9F5EE] border border-[#DFD3C3] rounded-full transition-all shadow-xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center font-bold text-xs shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{displayName}</span>
                {isAdmin && (
                  <span className="bg-[#FAF2EB] text-[#C86D51] text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full border border-[#F0D5C3]">
                    Admin
                  </span>
                )}
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8C7A70]" />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-24px)] rounded-2xl bg-white shadow-xl border border-[#EAE0D2] p-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-2 border-b border-[#F2E8DC] text-[#7A6B63]">
                      <p className="font-bold text-[#2D231E] truncate">{displayName}</p>
                      <p className="text-[11px] text-[#A6978C] truncate">{user.email}</p>
                      {isTrustedContributor && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                          <CheckCircle className="w-3 h-3" />
                          <span>Kontributor Tepercaya</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/my-places"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#382E2B] hover:bg-[#FAF6F0] font-medium transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-[#C86D51]" />
                      <span>Tempat Kontribusi Saya</span>
                    </Link>

                    <Link
                      to="/my-places?tab=favorites"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#382E2B] hover:bg-[#FAF6F0] font-medium transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>Tempat Favorit Saya</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#382E2B] hover:bg-[#FAF6F0] font-medium transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#C86D51]" />
                        <span>Panel Moderasi Admin</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF6F0] bg-[#382E2B] hover:bg-[#251D1A] rounded-full transition-all active:scale-95 shadow-sm"
              title="Masuk ke Akun"
            >
              <User className="w-4 h-4 text-[#F4CDBE]" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
