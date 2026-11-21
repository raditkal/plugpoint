import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, RefreshCw, Coffee, Plus } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import PlaceCard from '../components/PlaceCard'
import { getPlaces } from '../services/places'
import type { Place, PlaceFilterOptions } from '../types/place'

interface HomePageProps {
  onSelectPlace?: (place: Place) => void
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectPlace }) => {
  const [places, setPlaces] = useState<Place[]>([])
  const [filterOptions, setFilterOptions] = useState<PlaceFilterOptions>({ sortBy: 'most_popular' })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchPlaces = async (options: PlaceFilterOptions) => {
    setIsLoading(true)
    const result = await getPlaces(options)
    setPlaces(result.data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPlaces(filterOptions)
  }, [filterOptions])

  return (
    <div className="min-h-screen pb-20 bg-[#FAF6F0]">
      {/* HERO SECTION - Warm, Aesthetic, Playful Cafe Vibe */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20 border-b border-[#EFE7DE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">

          {/* Calming Warm Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#2D231E] max-w-2xl mx-auto leading-tight">
            Batre Aman,
            <br />
            Nugas Senang,
              <br />
            <span className="text-[#C86D51] underline decoration-[#F4CDBE] decoration-wavy decoration-2">
              Pikiran Tenang..
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#7A6B63] max-w-lg mx-auto leading-relaxed px-2">
            Temukan tempat nugas dengan Wi-Fi kencang, colokan melimpah, dan suasana tenang di area Simpang Timbangan, Gang Lampung, hingga Tanjung Senai.
          </p>

          {/* Search Bar & Quick Filters */}
          <div className="pt-2 sm:pt-4">
            <SearchBar
              filterOptions={filterOptions}
              onFilterChange={setFilterOptions}
              totalResults={places.length}
            />
          </div>
        </div>
      </section>

      {/* MAIN DIRECTORY CONTENT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-10 sm:space-y-14">

        {/* SECTION: SEMUA DAFTAR TEMPAT */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F0EAE1] border border-[#E3D7C8] flex items-center justify-center text-[#5C4A3E] shrink-0">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2D231E]">
                  Jelajahi Semua Tempat
                </h2>
                <p className="text-[11px] sm:text-xs text-[#7A6B63]">
                  Pilih spot favoritmu untuk belajar, meeting santai, atau ngerjain tugas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchPlaces(filterOptions)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors shrink-0"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>

          {/* Loading State - Soft Cream Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="rounded-3xl border border-[#EFE7DE] bg-white p-6 space-y-4 animate-pulse shadow-sm"
                >
                  <div className="h-5 bg-[#F5ECE1] rounded-full w-1/3"></div>
                  <div className="h-6 bg-[#F5ECE1] rounded-full w-3/4"></div>
                  <div className="h-4 bg-[#F5ECE1] rounded-full w-full"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-[#F5ECE1] rounded-full w-24"></div>
                    <div className="h-6 bg-[#F5ECE1] rounded-full w-28"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : places.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map(place => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onDetailClick={onSelectPlace}
                />
              ))}
            </div>
          ) : (
            /* Empty State - Cute & Cozy */
            <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-[#DFD3C3] bg-[#F7F1E8]/50 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[#EDE4D6] flex items-center justify-center text-[#8C6D58]">
                <Coffee className="w-7 h-7" />
              </div>

              {Boolean(
                (filterOptions.searchQuery && filterOptions.searchQuery.trim()) ||
                (filterOptions.sortBy && filterOptions.sortBy !== 'most_popular')
              ) ? (
                <>
                  <h3 className="text-lg font-bold text-[#2D231E]">
                    Belum ada tempat yang cocok nih~
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7A6B63] max-w-sm mx-auto">
                    Coba ganti filter atau kata kunci pencarian kamu ya!
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilterOptions({ sortBy: 'most_popular' })}
                    className="mt-2 inline-flex items-center px-4 py-2 text-xs font-bold text-[#C86D51] bg-[#FAF2EB] rounded-full hover:bg-[#F3E2D5] transition-colors border border-[#F0D5C3] cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-[#2D231E]">
                    Belum Ada Tempat Terdaftar
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7A6B63] max-w-sm mx-auto">
                    Direktori Indralaya masih segar! Yuk, jadilah orang pertama yang merekomendasikan spot kafe atau nugas favoritmu di sekitar UNSRI.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/add-place"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#C86D51] hover:bg-[#B35A3F] rounded-full transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Tempat Sekarang</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default HomePage
