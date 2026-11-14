import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Coffee, PlusCircle } from 'lucide-react'

export const AddPlacePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Beranda
        </Link>

        <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#2D231E]">Rekomendasikan Tempat Kerja</h1>
          <p className="text-xs sm:text-sm text-[#7A6B63] max-w-md mx-auto leading-relaxed">
            Formulir kontribusi tempat baru dengan validasi Wi-Fi, colokan, dan jam operasional akan siap pada tahap berikutnya!
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#382E2B] text-white text-xs font-bold hover:bg-[#251D1A] transition-all"
            >
              <Coffee className="w-4 h-4" />
              Jelajahi Tempat yang Ada
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddPlacePage

