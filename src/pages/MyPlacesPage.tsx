import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Coffee,
  Plus,
  MapPin,
  Wifi,
  Zap,
  Volume2,
  Clock,
  CheckCircle,
  Clock3,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyPlaces, getShortId } from '../services/places'
import type { Place, PlaceStatus } from '../types/place'

export const MyPlacesPage: React.FC = () => {
  const { user } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [filterStatus, setFilterStatus] = useState<PlaceStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserPlaces = async () => {
    if (!user?.id) return
    setIsLoading(true)
    const res = await getMyPlaces(user.id)
    setPlaces(res.data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchUserPlaces()
  }, [user?.id])

  // Filter berdasarkan status
  const filteredPlaces = filterStatus === 'all'
    ? places
    : places.filter((p) => p.status === filterStatus)

  const pendingCount = places.filter((p) => p.status === 'pending').length
  const approvedCount = places.filter((p) => p.status === 'approved').length
  const revisionCount = places.filter((p) => p.status === 'needs_revision').length
  const rejectedCount = places.filter((p) => p.status === 'rejected').length

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-10 px-4 sm:px-6 lg:px-8 text-[#382E2B]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigasi Kembali */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Direktori
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D231E]">
                Tempat Kontribusi Saya
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6B63] max-w-xl leading-relaxed">
              Pantau status peninjauan seluruh tempat kerja yang pernah kamu rekomendasikan ke Plugpoint.
            </p>
          </div>

          <Link
            to="/add-place"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs font-bold shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tempat Baru</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE7DE] shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#7A6B63] mr-1">Status:</span>
            
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-[#382E2B] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3] border border-[#E8DFD3]'
              }`}
            >
              Semua ({places.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              Menunggu ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              Disetujui ({approvedCount})
            </button>

            {revisionCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus('needs_revision')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'needs_revision'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-orange-700 hover:bg-orange-50 border border-orange-200'
                }`}
              >
                Perlu Revisi ({revisionCount})
              </button>
            )}

            {rejectedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus('rejected')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'rejected'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-rose-700 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                Ditolak ({rejectedCount})
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchUserPlaces}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#C86D51]" />
            <p className="text-xs font-bold text-[#7A6B63]">Memuat tempat kontribusimu...</p>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DE] shadow-xs space-y-4">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center">
              <Coffee className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#2D231E]">
                {filterStatus === 'all'
                  ? 'Belum ada tempat yang kamu ajukan'
                  : 'Tidak ada tempat dengan status ini'}
              </h3>
              <p className="text-xs text-[#7A6B63] max-w-sm mx-auto leading-relaxed">
                Punya kafe langganan dengan Wi-Fi kencang dan banyak colokan? Yuk rekomendasikan sekarang!
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/add-place"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#382E2B] hover:bg-[#251D1A] text-white text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Rekomendasikan Tempat</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPlaces.map((place) => {
              const hours = place.opening_hours as {
                daily?: { open?: string; close?: string }
              } | null

              return (
                <div
                  key={place.id}
                  className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs hover:shadow-sm transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EBE1] pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-[#2D231E]">{place.name}</h2>
                        
                        {/* Status Badges */}
                        {place.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Tayang di Direktori</span>
                          </span>
                        )}

                        {place.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock3 className="w-3.5 h-3.5" />
                            <span>Menunggu Moderasi</span>
                          </span>
                        )}

                        {place.status === 'needs_revision' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Perlu Revisi</span>
                          </span>
                        )}

                        {place.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#7A6B63] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                        <span>
                          {place.area} • {place.address}
                        </span>
                      </div>
                    </div>

                    {place.status === 'approved' && (
                      <Link
                        to={`/places/${getShortId(place.id)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE3] text-xs font-bold text-[#5C4A3E] border border-[#DFD3C3] w-fit transition-colors shadow-2xs"
                      >
                        <span>Lihat di Direktori</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#C86D51]" />
                      </Link>
                    )}
                  </div>

                  {/* Ringkasan Fasilitas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#C86D51] shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#A6978C] uppercase font-bold">Wi-Fi</p>
                        <p className="font-extrabold text-[#2D231E]">
                          {place.wifi_speed_mbps
                            ? `${place.wifi_speed_mbps} Mbps`
                            : `${place.wifi_rating || 0}/5 ★`}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#C86D51] shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#A6978C] uppercase font-bold">Colokan</p>
                        <p className="font-extrabold text-[#2D231E] capitalize">
                          {place.outlet_level === 'many'
                            ? 'Melimpah'
                            : place.outlet_level === 'few'
                            ? 'Terbatas'
                            : 'Belum tahu'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#C86D51] shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#A6978C] uppercase font-bold">Suasana</p>
                        <p className="font-extrabold text-[#2D231E] capitalize">
                          {place.noise_level === 'quiet'
                            ? 'Sunyi'
                            : place.noise_level === 'moderate'
                            ? 'Ramai Santai'
                            : 'Cukup Ramai'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#C86D51] shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#A6978C] uppercase font-bold">Operasional</p>
                        <p className="font-extrabold text-[#2D231E]">
                          {hours?.daily?.open && hours?.daily?.close
                            ? `${hours.daily.open} - ${hours.daily.close}`
                            : 'Buka Setiap Hari'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Catatan / Alasan dari Moderator jika Ditolak atau Perlu Revisi */}
                  {place.rejection_reason && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Catatan dari Tim Moderator:</span>
                      </p>
                      <p className="leading-relaxed pl-5">{place.rejection_reason}</p>
                    </div>
                  )}

                  <div className="text-[11px] text-[#A6978C] pt-1">
                    Diajukan pada: {new Date(place.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPlacesPage
