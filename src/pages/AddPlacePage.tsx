import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Coffee,
  MapPin,
  Wifi,
  Zap,
  Volume2,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createPlace, getShortId } from '../services/places'
import type { OutletLevel, NoiseLevel, PlaceInsert } from '../types/place'

export const AddPlacePage: React.FC = () => {
  const { user, isTrustedContributor, isAdmin } = useAuth()

  // Form State
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [wifiRating, setWifiRating] = useState<number>(4)
  const [wifiSpeed, setWifiSpeed] = useState<string>('')
  const [outletLevel, setOutletLevel] = useState<OutletLevel>('many')
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel>('quiet')
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('22:00')
  const [quietHours, setQuietHours] = useState('')
  const [notes, setNotes] = useState('')

  // UI State
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createdPlaceId, setCreatedPlaceId] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!user) {
      setErrorMsg('Kamu harus masuk terlebih dahulu untuk mengajukan tempat.')
      return
    }

    if (!name.trim() || !area.trim() || !address.trim()) {
      setErrorMsg('Mohon lengkapi nama tempat, area/kota, dan alamat.')
      return
    }

    setIsLoading(true)

    // Tentukan status publikasi berdasarkan hak akses user
    const autoApprove = isTrustedContributor || isAdmin
    const status = autoApprove ? 'approved' : 'pending'

    // Format opening_hours JSONB
    const openingHoursJson = {
      daily: {
        open: openTime,
        close: closeTime,
        is_closed: false,
      },
    }

    const payload: PlaceInsert = {
      name: name.trim(),
      area: area.trim(),
      address: address.trim(),
      wifi_rating: wifiRating || null,
      wifi_speed_mbps: wifiSpeed ? parseFloat(wifiSpeed) : null,
      outlet_level: outletLevel,
      noise_level: noiseLevel,
      opening_hours: openingHoursJson,
      quiet_hours: quietHours.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
      status: status,
    }

    const result = await createPlace(payload)
    setIsLoading(false)

    if (result.error) {
      setErrorMsg(`Gagal menyimpan: ${result.error}`)
    } else {
      setIsSuccess(true)
      if (result.data?.id) {
        setCreatedPlaceId(result.data.id)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-10 px-4 sm:px-6 lg:px-8 text-[#382E2B]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Tombol Kembali */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Direktori
        </Link>

        {/* Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D231E]">
                Rekomendasikan Tempat
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6B63] max-w-xl leading-relaxed">
              Punya kafe langganan atau tempat nugas tersembunyi dengan Wi-Fi kencang dan banyak colokan? Bagikan ke teman-teman di Plugpoint!
            </p>
          </div>

          {(isTrustedContributor || isAdmin) && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publikasi Langsung</span>
            </div>
          )}
        </div>

        {/* Notifikasi Sukses */}
        {isSuccess ? (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] shadow-sm text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#2D231E]">
                {isTrustedContributor || isAdmin ? 'Tempat Berhasil Dipublikasikan! 🎉' : 'Pengajuan Berhasil Dikirim! ☕'}
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6B63] max-w-md mx-auto leading-relaxed">
                {isTrustedContributor || isAdmin
                  ? 'Karena kamu adalah kontributor tepercaya/admin, tempat ini langsung tayang di direktori publik.'
                  : 'Terima kasih atas kontribusimu! Pengajuan tempat ini sedang menunggu peninjauan oleh tim moderator sebelum tampil di beranda.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {createdPlaceId && (isTrustedContributor || isAdmin) && (
                <Link
                  to={`/places/${getShortId(createdPlaceId)}`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs font-bold shadow-sm transition-all"
                >
                  Lihat Halaman Tempat
                </Link>
              )}
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#382E2B] hover:bg-[#251D1A] text-white text-xs font-bold transition-all"
              >
                Kembali ke Beranda
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false)
                  setName('')
                  setAddress('')
                  setNotes('')
                  setWifiSpeed('')
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#FAF2EB] hover:bg-[#F3E2D5] text-[#7A4B3A] text-xs font-bold transition-colors border border-[#F0D5C3]"
              >
                Tambah Tempat Lainnya
              </button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SEKSI 1: INFORMASI DASAR */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#2D231E] flex items-center gap-2 border-b border-[#F2E8DC] pb-3">
                <MapPin className="w-4 h-4 text-[#C86D51]" />
                <span>1. Lokasi & Identitas Tempat</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Nama Tempat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Titik Koma Dago, Ruang Seduh & Kerja"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Area / Kota <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Contoh: Bandung, Jakarta Selatan, Sleman"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Alamat Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Ir. H. Juanda No. 120, Dago, Coblong"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 2: FASILITAS KERJA (WI-FI & COLOKAN) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-sm space-y-5">
              <h2 className="text-sm font-black text-[#2D231E] flex items-center gap-2 border-b border-[#F2E8DC] pb-3">
                <Wifi className="w-4 h-4 text-[#C86D51]" />
                <span>2. Fasilitas Wi-Fi & Kebutuhan Daya</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Rating Wi-Fi */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Kualitas Koneksi Wi-Fi (1 - 5)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setWifiRating(star)}
                        className={`w-10 h-10 rounded-2xl text-xs font-extrabold transition-all ${
                          wifiRating >= star
                            ? 'bg-[#C86D51] text-white shadow-xs'
                            : 'bg-[#F2ECE3] text-[#7A6B63] hover:bg-[#E8DFD3]'
                        }`}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#A6978C]">
                    {wifiRating >= 4
                      ? '⚡ Kencang, stabil untuk video call & upload besar'
                      : wifiRating === 3
                      ? 'Cukup memadai untuk browsing & coding santai'
                      : 'Cenderung lambat atau sering putus'}
                  </p>
                </div>

                {/* Kecepatan Mbps */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Kecepatan Download (Mbps) <span className="text-[#A6978C] font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={wifiSpeed}
                    onChange={(e) => setWifiSpeed(e.target.value)}
                    placeholder="Contoh: 50 atau 100"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                  <p className="text-[11px] text-[#A6978C]">Berdasarkan hasil speedtest jika pernah dicoba</p>
                </div>

                {/* Ketersediaan Colokan */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-[#4A3B32] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#C86D51]" />
                    <span>Ketersediaan Stopkontak / Colokan Listrik</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setOutletLevel('many')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        outletLevel === 'many'
                          ? 'border-[#C86D51] bg-[#FAF2EB] text-[#7A4B3A] font-bold'
                          : 'border-[#E8DFD3] bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      <span className="block text-sm mb-0.5">🔌🔌🔌</span>
                      <span className="text-xs">Melimpah</span>
                      <span className="block text-[10px] text-[#A6978C] mt-0.5">Hampir tiap meja</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutletLevel('few')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        outletLevel === 'few'
                          ? 'border-[#C86D51] bg-[#FAF2EB] text-[#7A4B3A] font-bold'
                          : 'border-[#E8DFD3] bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      <span className="block text-sm mb-0.5">🔌</span>
                      <span className="text-xs">Terbatas</span>
                      <span className="block text-[10px] text-[#A6978C] mt-0.5">Hanya spot tertentu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutletLevel('unknown')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        outletLevel === 'unknown'
                          ? 'border-[#C86D51] bg-[#FAF2EB] text-[#7A4B3A] font-bold'
                          : 'border-[#E8DFD3] bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      <span className="block text-sm mb-0.5">❓</span>
                      <span className="text-xs">Belum Tahu</span>
                      <span className="block text-[10px] text-[#A6978C] mt-0.5">Perlu konfirmasi</span>
                    </button>
                  </div>
                </div>

                {/* Suasana Kebisingan */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-[#4A3B32] flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#C86D51]" />
                    <span>Suasana Tempat (Noise Level)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNoiseLevel('quiet')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        noiseLevel === 'quiet'
                          ? 'border-[#C86D51] bg-[#FAF2EB] text-[#7A4B3A] font-bold'
                          : 'border-[#E8DFD3] bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      <span className="block text-sm mb-0.5">🌿</span>
                      <span className="text-xs">Sunyi & Tenang</span>
                      <span className="block text-[10px] text-[#A6978C] mt-0.5">Cocok untuk fokus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNoiseLevel('moderate')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        noiseLevel === 'moderate'
                          ? 'border-[#C86D51] bg-[#FAF2EB] text-[#7A4B3A] font-bold'
                          : 'border-[#E8DFD3] bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      <span className="block text-sm mb-0.5">☕</span>
                      <span className="text-xs">Ramai Santai</span>
                      <span className="block text-[10px] text-[#A6978C] mt-0.5">Obrolan ringan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNoiseLevel('noisy')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        noiseLevel === 'noisy'
                          ? 'border-[#C86D51] bg-[#FAF2EB] text-[#7A4B3A] font-bold'
                          : 'border-[#E8DFD3] bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      <span className="block text-sm mb-0.5">📢</span>
                      <span className="text-xs">Cukup Ramai</span>
                      <span className="block text-[10px] text-[#A6978C] mt-0.5">Musik keras / ramai</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SEKSI 3: OPERASIONAL & CATATAN */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#2D231E] flex items-center gap-2 border-b border-[#F2E8DC] pb-3">
                <Clock className="w-4 h-4 text-[#C86D51]" />
                <span>3. Jam Operasional & Catatan Tambahan</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Jam Buka (WIB)
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Jam Tutup (WIB)
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#4A3B32]">
                    Rekomendasi Jam Tenang <span className="text-[#A6978C] font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={quietHours}
                    onChange={(e) => setQuietHours(e.target.value)}
                    placeholder="Contoh: 09:00 - 13:00 atau Sepanjang hari"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#4A3B32] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C86D51]" />
                    <span>Catatan Suasana & Tips Kerja</span>
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Lantai 2 khusus area laptop, colokan di bawah kursi, playlist lagu lofi sangat nyaman..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan Tempat...</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-4 h-4" />
                    <span>
                      {isTrustedContributor || isAdmin
                        ? 'Terbitkan Tempat Sekarang'
                        : 'Kirim Pengajuan Tempat'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddPlacePage
