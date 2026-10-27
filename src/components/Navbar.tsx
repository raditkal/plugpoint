import React from 'react'
import { Sparkles, Plus, User, Coffee } from 'lucide-react'

interface NavbarProps {
  onAddPlaceClick?: () => void
  onLoginClick?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onAddPlaceClick, onLoginClick }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#EFE7DE] bg-[#FAF6F0]/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - Cute & Warm Cafe Aesthetic */}
        <div className="flex items-center gap-3.5 cursor-pointer group">
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
        </div>

        {/* Action Buttons - Rounded & Playful */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAddPlaceClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#4A3B32] bg-[#F2ECE3] hover:bg-[#E8DFD3] border border-[#DFD3C3] rounded-full transition-all active:scale-95 shadow-2xs"
            title="Tambah Tempat Baru"
          >
            <Plus className="w-4 h-4 text-[#C86D51]" />
            <span className="hidden sm:inline">Rekomendasikan Tempat</span>
            <span className="sm:hidden">Tambah</span>
          </button>

          <button
            type="button"
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF6F0] bg-[#382E2B] hover:bg-[#251D1A] rounded-full transition-all active:scale-95 shadow-sm"
            title="Masuk ke Akun"
          >
            <User className="w-4 h-4 text-[#F4CDBE]" />
            <span>Masuk</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
