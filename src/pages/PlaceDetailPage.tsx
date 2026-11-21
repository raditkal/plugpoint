import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Wifi,
  Zap,
  Volume2,
  Clock,
  MapPin,
  ExternalLink,
  Flag,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Heart,
  Calendar,
  Share2,
  Check,
  Star,
  Send
} from 'lucide-react'
import { getPlaceById, formatAddedDate, formatFullDate, getPlaceReviews, createPlaceReview } from '../services/places'
import { useFavorites } from '../context/FavoritesContext'
import { useAuth } from '../context/AuthContext'
import type { Place, PlaceReview } from '../types/place'

// Fallback images cafe aesthetic
const DETAIL_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=1200',
]

export const PlaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [place, setPlace] = useState<Place | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)

  // Reviews State
  const [reviews, setReviews] = useState<PlaceReview[]>([])
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false)

  // Share Copy State
  const [copied, setCopied] = useState<boolean>(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    async function loadPlace() {
      if (!id) return
      setIsLoading(true)
      const res = await getPlaceById(id)
      setPlace(res.data)
      setIsLoading(false)

      if (res.data?.id) {
        const revRes = await getPlaceReviews(res.data.id)
        setReviews(revRes.data)
      }
    }
    loadPlace()
  }, [id])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !place) return

    setIsSubmittingReview(true)
    const res = await createPlaceReview({
      place_id: place.id,
      user_id: user.id,
      wifi_rating: reviewRating,
      outlet_rating: place.outlet_level === 'many' ? 5 : 4,
      noise_rating: place.noise_level === 'quiet' ? 5 : 4,
      comment: reviewComment.trim() || undefined,
    })

    if (res.data) {
      setReviews((prev) => [res.data!, ...prev.filter((r) => r.user_id !== user.id)])
      setReviewComment('')
    }
    setIsSubmittingReview(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E8DFD3] border border-[#D9CDBF] flex items-center justify-center text-[#8C6D58] animate-bounce">
            <Coffee className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#5C4A3E]">Menyiapkan informasi tempat...</p>
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-[#EFE7DE] shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDE8E8] text-[#C86D51] flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-[#2D231E]">Tempat Tidak Ditemukan</h2>
          <p className="text-xs text-[#7A6B63] leading-relaxed">
            Tempat yang kamu cari mungkin belum dipublikasikan atau link-nya keliru.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#382E2B] text-white text-xs font-bold hover:bg-[#251D1A] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  // Pilih gambar berdasarkan data tempat atau fallback estetik
  const hash = (place.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const heroImage = place.image_url || DETAIL_IMAGES[Math.abs(hash) % DETAIL_IMAGES.length]

  // Parsing opening hours
  const hours = place.opening_hours as { daily?: { open?: string; close?: string } } | null
  const dailyHours = hours?.daily?.open && hours?.daily?.close
    ? `${hours.daily.open} - ${hours.daily.close} WIB`
    : 'Buka Setiap Hari'

  const favorite = place ? isFavorite(place.id) : false
  const displayFavoritesCount = (place?.favorites_count || 0) + (favorite ? 1 : 0)

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24 text-[#382E2B]">
      {/* Top Navigation Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2ECE3] hover:bg-[#E8DFD3] text-xs font-bold text-[#4A3B32] transition-colors border border-[#DFD3C3]"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Direktori
        </Link>

        {/* Action Buttons: Share & Favorite */}
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#F2ECE3] text-xs font-bold text-[#5C4A3E] border border-[#DFD3C3] transition-colors shadow-2xs cursor-pointer"
            title="Salin tautan tempat ini"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#C86D51]" />
                <span className="hidden sm:inline">Bagikan</span>
              </>
            )}
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={() => toggleFavorite(place.id)}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              favorite
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-[#DFD3C3] text-[#5C4A3E] hover:border-rose-200 hover:text-rose-600'
            }`}
            title={favorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          >
            <Heart className={`w-3.5 h-3.5 ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{displayFavoritesCount} Favorit</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Hero Card */}
        <div className="rounded-3xl overflow-hidden bg-white border border-[#EFE7DE] shadow-sm">
          {/* Cover Image */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <img
              src={heroImage}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                {place.area || 'Tempat Kerja'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{place.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-[#F4EDE3]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#F4CDBE] shrink-0" />
                  <span>{place.address}</span>
                </div>
                <span className="opacity-50 hidden sm:inline">•</span>
                <span className="bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs text-[#FAF6F0]">
                  Direkomendasikan oleh <strong className="text-white">{place.profiles?.display_name || 'Komunitas Plugpoint'}</strong>
                </span>
                <span className="opacity-50 hidden sm:inline">•</span>
                <span className="bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs text-[#FAF6F0] flex items-center gap-1.5" title={place.created_at ? `Ditambahkan pada ${formatFullDate(place.created_at)}` : undefined}>
                  <Calendar className="w-3.5 h-3.5 text-[#F4CDBE]" />
                  <span>Ditambahkan {formatAddedDate(place.created_at)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 sm:p-6 bg-[#FAF7F2] border-t border-[#EFE7DE]">
            {/* Wi-Fi */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFE4D6] flex items-center justify-center text-[#8C6D58] shrink-0">
                <Wifi className="w-5 h-5 text-[#C86D51]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8C7A70] uppercase">Wi-Fi</p>
                <p className="text-sm font-extrabold text-[#2D231E]">
                  {place.wifi_speed_mbps ? `${place.wifi_speed_mbps} Mbps` : place.wifi_rating ? `${place.wifi_rating}/5 ★` : 'Tersedia'}
                </p>
              </div>
            </div>

            {/* Colokan Listrik */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFE4D6] flex items-center justify-center text-[#8C6D58] shrink-0">
                <Zap className="w-5 h-5 text-[#C86D51]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8C7A70] uppercase">Stopkontak</p>
                <p className="text-sm font-extrabold text-[#2D231E] capitalize">
                  {place.outlet_level === 'many' ? 'Melimpah' : place.outlet_level === 'few' ? 'Terbatas' : 'Tersedia'}
                </p>
              </div>
            </div>

            {/* Suasana */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFE4D6] flex items-center justify-center text-[#8C6D58] shrink-0">
                <Volume2 className="w-5 h-5 text-[#C86D51]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8C7A70] uppercase">Suasana</p>
                <p className="text-sm font-extrabold text-[#2D231E] capitalize">
                  {place.noise_level === 'quiet' ? 'Sunyi & Tenang' : place.noise_level === 'moderate' ? 'Ramai Santai' : 'Cukup Ramai'}
                </p>
              </div>
            </div>

            {/* Jam Buka */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFE4D6] flex items-center justify-center text-[#8C6D58] shrink-0">
                <Clock className="w-5 h-5 text-[#C86D51]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8C7A70] uppercase">Operasional</p>
                <p className="text-sm font-extrabold text-[#2D231E]">
                  {dailyHours}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Catatan & Suasana Kerja */}
          <div className="lg:col-span-2 space-y-6">
            {/* Catatan Tempat */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-sm space-y-4">
              <h2 className="text-lg font-black text-[#2D231E] flex items-center gap-2">
                <span>☕</span>
                <span>Catatan & Suasana Kerja</span>
              </h2>
              <p className="text-sm text-[#5C4D45] leading-relaxed">
                {place.notes || 'Tempat kerja nyaman dengan koneksi internet memadai dan meja yang ramah untuk penggunaan laptop.'}
              </p>
              {place.quiet_hours && (
                <div className="mt-4 p-4 rounded-2xl bg-[#FAF2EB] border border-[#F0D5C3] flex items-start gap-3">
                  <span className="text-lg">🌿</span>
                  <div className="text-xs">
                    <strong className="text-[#2D231E] block font-bold">Jam Tenang Disarankan:</strong>
                    <span className="text-[#7A6B63]">{place.quiet_hours}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist Fasilitas Kerja */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-sm space-y-4">
              <h2 className="text-lg font-black text-[#2D231E] flex items-center gap-2">
                <span>✨</span>
                <span>Fasilitas Terverifikasi</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#5C4D45]">
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FBF8F4] border border-[#F0E6D8]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Wi-Fi {place.wifi_speed_mbps ? `${place.wifi_speed_mbps} Mbps` : 'Tersedia'}</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FBF8F4] border border-[#F0E6D8]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Stopkontak {place.outlet_level === 'many' ? 'Hampir di setiap meja' : 'Tersedia di beberapa titik'}</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FBF8F4] border border-[#F0E6D8]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Area Meja Laptop Friendly</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FBF8F4] border border-[#F0E6D8]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ruang Ber-AC & Dingin Nyaman</span>
                </div>
              </div>
            </div>

            {/* Ulasan & Rating Komunitas */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#F2E8DC] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <h2 className="text-lg font-black text-[#2D231E]">
                    Ulasan Pengunjung ({reviews.length})
                  </h2>
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#FAF2EB] px-3 py-1 rounded-full text-xs font-extrabold text-[#C86D51] border border-[#F0D5C3]">
                    <Star className="w-3.5 h-3.5 fill-[#C86D51] text-[#C86D51]" />
                    <span>
                      {(
                        reviews.reduce((acc, r) => acc + (r.wifi_rating || 5), 0) / reviews.length
                      ).toFixed(1)}{' '}
                      / 5.0
                    </span>
                  </div>
                )}
              </div>

              {/* Form Tambah Ulasan */}
              {user ? (
                <form onSubmit={handleReviewSubmit} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] space-y-3">
                  <p className="text-xs font-bold text-[#2D231E]">Tulis Ulasan & Pengalaman Nugas:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7A6B63]">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-[#DFD3C3]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Bagaimana kecepatan Wi-Fi dan suasananya? (opsional)"
                    className="w-full text-xs p-3 rounded-xl border border-[#DFD3C3] bg-white text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSubmittingReview ? 'Mengirim...' : 'Kirim Ulasan'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A6B63]">
                  <span>Ingin berbagi ulasan pengalaman nugas di sini?</span>
                  <Link
                    to="/login"
                    className="font-bold text-[#C86D51] hover:underline"
                  >
                    Masuk untuk mengulas →
                  </Link>
                </div>
              )}

              {/* Daftar Ulasan */}
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-xs text-[#A8988C] text-center py-4 italic">
                    Belum ada ulasan untuk tempat ini. Jadilah yang pertama memberikan ulasan!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#F2ECE3] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EFE4D6] text-[#8C6D58] font-bold text-[10px] flex items-center justify-center border border-[#DFD3C3]">
                            {(rev.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-[#2D231E]">
                            {rev.profiles?.display_name || 'Pengunjung Plugpoint'}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: rev.wifi_rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-[#5C4D45] leading-relaxed pl-8">
                          "{rev.comment}"
                        </p>
                      )}
                      <p className="text-[10px] text-[#A8988C] text-right">
                        {formatAddedDate(rev.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Aksi & Lokasi */}
          <div className="space-y-6">
            {/* Riwayat & Kontributor Tempat */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-sm space-y-3.5">
              <h3 className="text-sm font-bold text-[#2D231E] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C86D51]" />
                Riwayat & Kontributor
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#F4EBE1]">
                  <span className="text-[#8C7A70]">Direkomendasikan oleh</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-[#2D231E] font-bold">
                      {place.profiles?.display_name || 'Komunitas Plugpoint'}
                    </strong>
                    {place.profiles?.contributor_status === 'trusted' && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Trusted
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#F4EBE1]">
                  <span className="text-[#8C7A70]">Kapan ditambahkan</span>
                  <div className="text-right">
                    <span className="text-[#2D231E] font-bold block">{formatAddedDate(place.created_at)}</span>
                    <span className="text-[10px] text-[#A8988C]">{formatFullDate(place.created_at)}</span>
                  </div>
                </div>
                {place.updated_at && place.updated_at !== place.created_at && (
                  <div className="flex items-center justify-between text-[11px] text-[#8C7A70]">
                    <span>Terakhir diperbarui</span>
                    <span>{formatAddedDate(place.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lokasi & Google Maps */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#2D231E] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C86D51]" />
                Lokasi Tempat
              </h3>
              <p className="text-xs text-[#7A6B63] leading-relaxed">
                {place.address}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${place.name} ${place.address}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#382E2B] hover:bg-[#251D1A] text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Bantuan & Pelaporan */}
            <div className="bg-[#FAF2EB] rounded-3xl p-6 border border-[#F0D5C3] space-y-3">
              <h3 className="text-xs font-bold text-[#C86D51] uppercase tracking-wider">
                Ada Informasi yang Kurang Tepat?
              </h3>
              <p className="text-xs text-[#5C4D45] leading-relaxed">
                Bantu sesama pekerja remote dan mahasiswa menjaga keakuratan informasi tempat ini.
              </p>
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-[#F5ECE1] text-[#7A4B3A] border border-[#E3C2AE] text-xs font-bold transition-colors"
              >
                <Flag className="w-3.5 h-3.5 text-[#C86D51]" />
                Laporkan Perubahan Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-[#EAE0D2] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#2D231E] flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#C86D51]" />
                Lapor Data Tempat
              </h3>
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false)
                  setReportSubmitted(false)
                }}
                className="w-7 h-7 rounded-full bg-[#F5ECE1] text-[#7A6B63] hover:text-[#2D231E] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {reportSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2D231E]">Laporan Terkirim!</h4>
                <p className="text-xs text-[#7A6B63]">
                  Terima kasih banyak! Tim moderator Plugpoint akan memeriksa laporanmu.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReportModalOpen(false)
                    setReportSubmitted(false)
                  }}
                  className="mt-2 py-2 px-6 rounded-full bg-[#382E2B] text-white text-xs font-bold"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setReportSubmitted(true)
                }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#4A3B32]">Alasan Pelaporan</label>
                  <select className="w-full text-xs p-3 rounded-2xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]">
                    <option value="inaccurate_wifi">Wi-Fi lambat atau tidak berfungsi</option>
                    <option value="inaccurate_outlets">Colokan listrik tidak tersedia / minim</option>
                    <option value="permanently_closed">Tempat sudah tutup permanen</option>
                    <option value="wrong_location">Alamat atau titik lokasi salah</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#4A3B32]">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Sekarang stopkontak hanya ada di smoking area..."
                    className="w-full text-xs p-3 rounded-2xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Kirim Laporan
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaceDetailPage

