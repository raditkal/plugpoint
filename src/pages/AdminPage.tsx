import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Beranda
        </Link>

        <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#2D231E]">Dashboard Moderasi Admin</h1>
              <p className="text-xs text-[#7A6B63]">
                Kelola pengajuan tempat tertunda dan laporan kesalahan data
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#EFE7DE] text-center py-10 space-y-2">
            <p className="text-sm font-semibold text-[#5C4A3E]">
              Dashboard moderasi sedang disiapkan untuk Tahap 5 (Moderasi).
            </p>
            <p className="text-xs text-[#A6978C]">
              Admin akan dapat menyetujui, menolak, atau meminta revisi pengajuan tempat.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

