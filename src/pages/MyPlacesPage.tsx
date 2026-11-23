import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  RefreshCw,
  Heart,
  Calendar,
  User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { getMyPlaces, getShortId, formatAddedDate, formatFullDate, getPlaceImageUrl } from '../services/places'
import PlaceCard from '../components/PlaceCard'
import type { Place, PlaceStatus } from '../types/place'

export const MyPlacesPage: React.FC = () => {
  const { user } = useAuth()
  const { favorites, favoritePlaces, isLoadingFavorites } = useFavorites()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') === 'favorites' ? 'favorites' : 'submissions'

  // State untuk Kontribusi Saya
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
    <div className="min-h-screen bg-[#FAF6F0] py-6 sm:py-10 px-3 sm:px-6 lg:px-8 text-[#382E2B]">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Navigasi Kembali */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Direktori
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#EFE7DE] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <h1 className="text-xl sm:text-3xl font-black text-[#2D231E]">
                Koleksi & Kontribusi Saya
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6B63] max-w-xl leading-relaxed">
              Kelola tempat kerja yang pernah kamu rekomendasikan dan temukan kembali daftar tempat favorit yang kamu sukai.
            </p>
          </div>

          <Link
            to="/add-place"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs font-bold shadow-sm transition-all shrink-0 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tempat Baru</span>
          </Link>
        </div>

        {/* Tab Navigasi Utama: Kontribusi vs Favorit */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F2ECE3] p-1.5 rounded-2xl border border-[#DFD3C3] w-full sm:w-fit shadow-2xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'bg-white text-[#2D231E] shadow-xs'
                : 'text-[#7A6B63] hover:text-[#2D231E]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C86D51]" />
            <span>Kontribusi Saya</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FAF2EB] text-[#C86D51] font-bold">
              {places.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'favorites' })}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-white text-[#2D231E] shadow-xs'
                : 'text-[#7A6B63] hover:text-[#2D231E]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 fill-rose-500" />
            <span>Tempat Favorit</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-600 font-bold border border-rose-100">
              {favorites.length}
            </span>
          </button>
        </div>

        {/* TAB 1: KONTRIBUSI SAYA */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 sm:p-4 rounded-3xl border border-[#EFE7DE] shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#7A6B63] mr-1 shrink-0">Status:</span>

                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
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
                  className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
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
                  className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    filterStatus === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  Disetujui ({approvedCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    filterStatus === 'rejected'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-rose-700 hover:bg-rose-50 border border-rose-200'
                  }`}
                >
                  Ditolak ({rejectedCount})
                </button>

                {revisionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterStatus('needs_revision')}
                    className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      filterStatus === 'needs_revision'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-orange-700 hover:bg-orange-50 border border-orange-200'
                    }`}
                  >
                    Perlu Revisi ({revisionCount})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchUserPlaces}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors cursor-pointer self-end sm:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </button>
            </div>

            {/* Content List Kontribusi */}
            {!user ? (
              <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-[#EFE7DE] shadow-xs space-y-4">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#2D231E]">
                    Masuk untuk Melihat Riwayat Kontribusimu
                  </h3>
                  <p className="text-xs text-[#7A6B63] max-w-sm mx-auto leading-relaxed">
                    Masuk ke akunmu untuk memantau status moderasi (disetujui, perlu revisi, atau ditolak) dari tempat yang kamu rekomendasikan.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#382E2B] hover:bg-[#251D1A] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <User className="w-4 h-4 text-[#F4CDBE]" />
                    <span>Masuk ke Akun</span>
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAF2EB] hover:bg-[#F3E2D5] text-[#7A4B3A] text-xs font-bold transition-colors border border-[#F0D5C3]"
                  >
                    <span>Daftar Gratis</span>
                  </Link>
                </div>
              </div>
            ) : isLoading ? (
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
                      : filterStatus === 'rejected'
                      ? 'Tidak ada pengajuan yang ditolak'
                      : filterStatus === 'pending'
                      ? 'Tidak ada pengajuan yang menunggu moderasi'
                      : filterStatus === 'approved'
                      ? 'Belum ada tempat yang disetujui'
                      : 'Tidak ada tempat dengan status ini'}
                  </h3>
                  <p className="text-xs text-[#7A6B63] max-w-sm mx-auto leading-relaxed">
                    {filterStatus === 'rejected'
                      ? 'Kabar baik! Semua tempat yang kamu rekomendasikan telah diterima atau masih dalam proses peninjauan.'
                      : 'Punya kafe langganan dengan Wi-Fi kencang dan banyak colokan? Yuk rekomendasikan sekarang!'}
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
                        <div className="flex items-start gap-3.5">
                          {getPlaceImageUrl(place) && (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-[#E8DFD3] shadow-2xs">
                              <img
                                src={getPlaceImageUrl(place)!}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
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

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7A6B63] mt-1.5">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                              <span>
                                {place.area} • {place.address}
                              </span>
                            </div>
                            <span className="text-[#C5B7AA]">•</span>
                            <div
                              className="flex items-center gap-1 text-[11px] text-[#8C7A70]"
                              title={place.created_at ? `Diajukan pada ${formatFullDate(place.created_at)}` : undefined}
                            >
                              <Calendar className="w-3 h-3 text-[#A8988C]" />
                              <span>Diajukan {formatAddedDate(place.created_at)}</span>
                            </div>
                          </div>
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

                      {/* Catatan Moderator jika Ditolak */}
                      {place.status === 'rejected' && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
                          <p className="font-bold flex items-center gap-1.5 text-rose-700">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Pengajuan Ditolak oleh Moderator</span>
                          </p>
                          <p className="leading-relaxed pl-5.5 text-rose-800">
                            {place.rejection_reason ||
                              (place.opening_hours as any)?.rejection_reason ||
                              'Pengajuan tempat ini belum dapat disetujui karena tidak memenuhi kriteria direktori Plugpoint atau merupakan tempat duplikat.'}
                          </p>
                        </div>
                      )}

                      {/* Catatan Moderator jika Perlu Revisi */}
                      {place.status === 'needs_revision' && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                          <p className="font-bold flex items-center gap-1.5 text-amber-800">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Catatan Revisi dari Tim Moderator:</span>
                          </p>
                          <p className="leading-relaxed pl-5.5 text-amber-900">
                            {place.rejection_reason ||
                              (place.opening_hours as any)?.rejection_reason ||
                              'Silakan perbarui atau lengkapi data tempat ini.'}
                          </p>
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
        )}

        {/* TAB 2: TEMPAT FAVORIT SAYA */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            {!user ? (
              <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-[#EFE7DE] shadow-xs space-y-4">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                  <Heart className="w-7 h-7 fill-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#2D231E]">
                    Masuk untuk Melihat Koleksi Favoritmu
                  </h3>
                  <p className="text-xs text-[#7A6B63] max-w-sm mx-auto leading-relaxed">
                    Masuk atau buat akun Plugpoint untuk menyimpan kafe dan tempat kerja favorit yang kamu sukai.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#382E2B] hover:bg-[#251D1A] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <User className="w-4 h-4 text-[#F4CDBE]" />
                    <span>Masuk ke Akun</span>
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAF2EB] hover:bg-[#F3E2D5] text-[#7A4B3A] text-xs font-bold transition-colors border border-[#F0D5C3]"
                  >
                    <span>Daftar Gratis</span>
                  </Link>
                </div>
              </div>
            ) : isLoadingFavorites ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-rose-500" />
                <p className="text-xs font-bold text-[#7A6B63]">Memuat tempat favoritmu...</p>
              </div>
            ) : favoritePlaces.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DE] shadow-xs space-y-4">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                  <Heart className="w-7 h-7 fill-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#2D231E]">
                    Belum ada tempat favorit
                  </h3>
                  <p className="text-xs text-[#7A6B63] max-w-sm mx-auto leading-relaxed">
                    Saat menjelajahi beranda, klik ikon hati ❤️ pada kartu tempat yang kamu sukai untuk menyimpannya ke daftar ini.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#382E2B] hover:bg-[#251D1A] text-white text-xs font-bold transition-all"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Jelajahi Direktori</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#7A6B63]">
                  <p>
                    Menampilkan <strong className="text-[#2D231E]">{favoritePlaces.length}</strong> tempat tersimpan
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoritePlaces.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPlacesPage
