import React from 'react'
import { Link } from 'react-router-dom'
import { Wifi, Clock, MapPin, ArrowRight, Heart } from 'lucide-react'
import type { Place } from '../types/place'
import { getShortId } from '../services/places'
import { useFavorites } from '../context/FavoritesContext'

interface PlaceCardProps {
  place: Place
  onDetailClick?: (place: Place) => void
}

// Koleksi gambar cafe aesthetic untuk fallback yang variatif
const CAFE_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=800',
]

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onDetailClick }) => {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(place.id)

  // Dapatkan URL gambar berdasarkan place atau fallback variatif
  const getImageSource = () => {
    if (place.image_url) return place.image_url

    // Hash nama tempat untuk memilih gambar cafe konsisten
    const hash = (place.id || place.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return CAFE_IMAGES[Math.abs(hash) % CAFE_IMAGES.length]
  }

  // Ekstraksi jam tutup
  const extractClosingHour = () => {
    const hours = place.opening_hours as { daily?: { open?: string; close?: string } } | null
    if (hours?.daily?.close) {
      const close = hours.daily.close
      return close.includes('WIB') ? `Tutup ${close}` : `Tutup ${close} WIB`
    }
    return 'Buka Setiap Hari'
  }

  // Generate tags lucu & relevan
  const getTags = () => {
    const tags: string[] = ['#WorkFromCafe']

    if (place.outlet_level === 'many') {
      tags.push('#PowerOutlets')
    } else if (place.outlet_level === 'few') {
      tags.push('#ColokanTersedia')
    }

    if (place.noise_level === 'quiet') {
      tags.push('#SunyiTenang')
    } else if (place.noise_level === 'moderate') {
      tags.push('#CozyVibes')
    }

    if (place.area) {
      const cleanArea = place.area.split(',')[0].replace(/\s+/g, '')
      tags.push(`#${cleanArea}`)
    } else {
      tags.push('#IndoorAC')
    }

    return tags.slice(0, 4)
  }

  const closingHour = extractClosingHour()
  const tags = getTags()
  const displayWifi = place.wifi_speed_mbps
    ? `${place.wifi_speed_mbps} Mbps`
    : place.wifi_rating
      ? `${place.wifi_rating}.0 ★`
      : 'Wi-Fi Cepat'

  return (
    <div className="w-full max-w-sm sm:max-w-none bg-cafe-card rounded-3xl overflow-hidden shadow-cozy border-2 border-[#F3EBE1] hover:shadow-cozy-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
      {/* Header Image Wrapper */}
      <div className="relative h-56 sm:h-60 overflow-hidden group">
        <img
          src={getImageSource()}
          onError={(e) => {
            const target = e.currentTarget
            target.onerror = null
            target.src = CAFE_IMAGES[0]
          }}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay Gradient for better badge visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {/* Jam Tutup Badge (Top Right) */}
        <div className="absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-bold text-cafe-text border border-white/50">
          <span className="w-2 h-2 rounded-full bg-cafe-green animate-pulse" />
          <Clock className="w-3.5 h-3.5 text-cafe-primary" />
          <span>{closingHour}</span>
        </div>

        {/* Favorite / Heart Button (Top Left Cute Accent) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(place.id)
          }}
          className={`absolute top-3.5 left-3.5 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-sm hover:scale-110 active:scale-95 cursor-pointer ${
            favorite ? 'text-rose-500 scale-105' : 'text-[#8C7A70] hover:text-rose-500'
          }`}
          title={favorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
        >
          <Heart className={`w-4 h-4 transition-transform ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5 sm:p-6 flex flex-col gap-4 flex-1 justify-between">
        <div className="flex flex-col gap-4">
          {/* Title & Wi-Fi Speed Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="heading-font text-2xl font-bold text-cafe-text tracking-wide leading-snug truncate">
                {place.name}
              </h2>
              {/* Location */}
              <div className="flex items-center gap-1.5 text-cafe-lightText text-xs font-semibold mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
                <span className="truncate">{place.area || place.address}</span>
              </div>
            </div>

            {/* Wi-Fi Speed Badge */}
            <div
              className="bg-[#F6EFE6] px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-cafe-primary border border-[#EBE0D3] shrink-0"
              title="Kecepatan Wi-Fi"
            >
              <Wifi className="w-3.5 h-3.5 text-cafe-accent" />
              <span className="text-xs font-extrabold heading-font">{displayWifi}</span>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-cafe-text text-sm leading-relaxed line-clamp-2">
            {place.notes ||
              `Tempat nongkrong & WFC nyaman dengan suasana ${
                place.noise_level === 'quiet' ? 'tenang' : 'hangat'
              }, stopkontak ${
                place.outlet_level === 'many' ? 'melimpah' : 'tersedia'
              }, serta racikan kopi nikmat! ☕✨`}
          </p>

          {/* Tags Section */}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-[#F8F1E9] text-cafe-primary text-[11px] font-bold px-2.5 py-1 rounded-xl border border-[#EEE2D5] hover:bg-[#EFE3D5] transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Kontributor Info */}
          <div className="flex items-center justify-between text-[11px] text-[#7A6B63] pt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-[#EFE4D6] text-[#8C6D58] flex items-center justify-center font-bold text-[10px] shrink-0 border border-[#DFD3C3]">
                {(place.profiles?.display_name || 'K').charAt(0).toUpperCase()}
              </div>
              <span className="truncate">
                Oleh{' '}
                <strong className="text-[#2D231E] font-semibold">
                  {place.profiles?.display_name || 'Komunitas Plugpoint'}
                </strong>
              </span>
            </div>

            {place.profiles?.contributor_status === 'trusted' && (
              <span
                className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0"
                title="Kontributor Tepercaya"
              >
                ✓ Trusted
              </span>
            )}
          </div>
        </div>

        <div>
          {/* Divider Line */}
          <div className="h-[1px] w-full bg-[#F2E8DC] my-0.5 mb-4" />

          {/* Action Button */}
          {onDetailClick ? (
            <button
              type="button"
              onClick={() => onDetailClick(place)}
              className="w-full bg-cafe-primary hover:bg-[#5C402D] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all group/btn cursor-pointer"
            >
              <span className="heading-font tracking-wide">Lihat Detail</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          ) : (
            <Link
              to={`/places/${getShortId(place.id)}`}
              className="w-full bg-cafe-primary hover:bg-[#5C402D] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all group/btn cursor-pointer"
            >
              <span className="heading-font tracking-wide">Lihat Detail</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlaceCard
