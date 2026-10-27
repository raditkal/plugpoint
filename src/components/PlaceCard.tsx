import React from 'react'
import { Wifi, Clock, MapPin, ArrowRight } from 'lucide-react'
import type { Place } from '../types/place'

interface PlaceCardProps {
    place: Place
    onDetailClick?: (place: Place) => void
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onDetailClick }) => {
    // Badge colokan dengan warna pastel ramah
    const renderOutletBadge = () => {
        switch (place.outlet_level) {
            case 'many':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F1F6EE] text-[#426630] border border-[#D9E6D3]">
                        <span>🔌</span> Banyak Colokan
                    </span>
                )
            case 'few':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FDF7E7] text-[#8A6C1F] border border-[#F5E4B4]">
                        <span>🔌</span> Colokan Terbatas
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5EFE6] text-[#7A6B63] border border-[#E8DFD3]">
                        <span>🔌</span> Cek Colokan
                    </span>
                )
        }
    }

    // Badge suasana kebisingan
    const renderNoiseBadge = () => {
        switch (place.noise_level) {
            case 'quiet':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F0F5F4] text-[#446761] border border-[#D3E3E0]">
                        <span>🌿</span> Sunyi & Tenang
                    </span>
                )
            case 'moderate':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F8F5EE] text-[#6B5A4B] border border-[#EAE2D5]">
                        <span>☕</span> Suasana Santai
                    </span>
                )
            case 'noisy':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FDF2F0] text-[#A64B3B] border border-[#F8D4CE]">
                        <span>💬</span> Cukup Ramai
                    </span>
                )
            default:
                return null
        }
    }

    // Ekstraksi jam tutup
    const extractClosingHour = () => {
        const hours = place.opening_hours as { daily?: { open?: string; close?: string } } | null
        if (hours?.daily?.close) {
            return `Tutup ${hours.daily.close}`
        }
        return null
    }

    const closingHour = extractClosingHour()

    return (
        <article className="group flex flex-col justify-between rounded-3xl bg-white border border-[#EFE7DE] p-6 shadow-sm hover:shadow-md hover:border-[#D9CDBF] transition-all duration-200">
            <div className="space-y-4">
                {/* Header: Area & Wi-Fi */}
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C86D51] bg-[#FAF2EB] border border-[#F0D5C3] px-3 py-1 rounded-full">
                        <MapPin className="w-3 h-3 text-[#C86D51]" />
                        {place.area}
                    </span>

                    {place.wifi_rating ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF5EB] border border-[#EFE2CC] text-[#7A5B2B] text-xs font-semibold">
                            <Wifi className="w-3.5 h-3.5 text-[#C88A32]" />
                            <span>{place.wifi_rating}.0</span>
                            {place.wifi_speed_mbps && (
                                <span className="text-[11px] text-[#A68352] font-normal">
                                    ({place.wifi_speed_mbps} Mbps)
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-[#9E8E84]">Wi-Fi blm dinilai</span>
                    )}
                </div>

                {/* Place Title & Address */}
                <div>
                    <h3 className="text-xl font-bold text-[#2D231E] group-hover:text-[#C86D51] transition-colors line-clamp-1">
                        {place.name}
                    </h3>
                    <p className="text-xs text-[#7A6B63] mt-1.5 line-clamp-2 leading-relaxed">
                        {place.address}
                    </p>
                </div>

                {/* Badges Fasilitas Kerja */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {renderOutletBadge()}
                    {renderNoiseBadge()}
                </div>

                {/* Catatan Tempat (Quote Bubble) */}
                {place.notes && (
                    <p className="text-xs text-[#5C4D45] bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE4D8] line-clamp-2 italic leading-relaxed">
                        "{place.notes}"
                    </p>
                )}
            </div>

            {/* Footer: Jam Operasional & Tombol Detail */}
            <div className="mt-6 pt-4 border-t border-[#F5ECE1] flex items-center justify-between gap-3 text-xs">
                {closingHour ? (
                    <div className="flex items-center gap-1.5 text-[#7A6B63]">
                        <Clock className="w-3.5 h-3.5 text-[#A8988C]" />
                        <span>{closingHour}</span>
                    </div>
                ) : (
                    <span className="text-[#9E8E84]">Jam buka fleksibel</span>
                )}

                <button
                    type="button"
                    onClick={() => onDetailClick?.(place)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs text-[#4A3B32] bg-[#F5EFE6] hover:bg-[#E8DFD3] rounded-full transition-all group-hover:translate-x-0.5"
                >
                    <span>Detail</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C86D51]" />
                </button>
            </div>
        </article>
    )
}

export default PlaceCard
