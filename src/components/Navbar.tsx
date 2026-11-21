import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, User, Coffee, LogOut, ShieldCheck, ChevronDown, CheckCircle, MapPin, Clock3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, isTrustedContributor, signOut } = useAuth()
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
    <header className="sticky top-0 z-50 w-full border-b border-[#EFE7DE] bg-[#FAF6F0]/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - Cute & Warm Cafe Aesthetic */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl bg-[#E8DFD3] border border-[#D9CDBF] flex items-center justify-center text-[#6B5344] shadow-sm group-hover:rotate-6 transition-transform">
            <Coffee className="w-5 h-5 text-[#8C6D58]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#2D231E]">
                plugpoint<span className="text-[#C86D51]">.</span>
              </span>
            </div>
          </div>
        </Link>

        {/* Action Buttons - Rounded & Playful */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Tombol Rekomendasikan Tempat */}
          <Link
            to="/add-place"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#4A3B32] bg-[#F2ECE3] hover:bg-[#E8DFD3] border border-[#DFD3C3] rounded-full transition-all active:scale-95 shadow-2xs"
            title="Tambah Tempat Baru"
          >
            <Plus className="w-4 h-4 text-[#C86D51]" />
            <span className="hidden sm:inline">Rekomendasikan Tempat</span>
            <span className="sm:hidden">Tambah</span>
          </Link>

          {/* Tombol Tempat Saya (muncul jika user sedang login) */}
          {user && (
            <Link
              to="/my-places"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#4A3B32] bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#DFD3C3] rounded-full transition-all active:scale-95 shadow-2xs"
              title="Lihat Tempat Kontribusi Saya"
            >
              <Clock3 className="w-4 h-4 text-[#C86D51]" />
              <span className="hidden md:inline">Tempat Saya</span>
              <span className="md:hidden">Saya</span>
            </Link>
          )}

          {/* User Section: Login vs Authenticated Menu */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#2D231E] bg-white hover:bg-[#F9F5EE] border border-[#DFD3C3] rounded-full transition-all shadow-xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center font-bold text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{displayName}</span>
                {isAdmin && (
                  <span className="bg-[#FAF2EB] text-[#C86D51] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#F0D5C3]">
                    Admin
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#8C7A70]" />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-[#EAE0D2] p-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-1">
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
