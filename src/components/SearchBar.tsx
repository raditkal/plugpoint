import React from 'react'
import { Search, X, Wifi, Zap, Volume2, Moon, Sparkles, Clock, Heart, MapPin } from 'lucide-react'
import type { PlaceFilterOptions } from '../types/place'

interface SearchBarProps {
  filterOptions: PlaceFilterOptions
  onFilterChange: (newOptions: PlaceFilterOptions) => void
  totalResults: number
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filterOptions,
  onFilterChange,
  totalResults,
}) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filterOptions,
      searchQuery: e.target.value,
    })
  }

  const clearQuery = () => {
    onFilterChange({
      ...filterOptions,
      searchQuery: '',
    })
  }

  const toggleFilter = (key: keyof Omit<PlaceFilterOptions, 'searchQuery'>) => {
    onFilterChange({
      ...filterOptions,
      [key]: !filterOptions[key],
    })
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-4">
      {/* Search Input Box - Cozy Rounded 3XL with Warm Beige Border */}
      <div className="relative flex items-center rounded-3xl bg-white border-2 border-[#EADFCF] focus-within:border-[#C86D51] shadow-sm shadow-[#E3D7C8]/40 transition-all p-1">
        <div className="pl-3.5 sm:pl-5 text-[#8C6D58] shrink-0">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <input
          type="text"
          value={filterOptions.searchQuery || ''}
          onChange={handleQueryChange}
          placeholder="Cari spot nugas, kafe, atau area di Indralaya..."
          className="w-full py-2.5 sm:py-4 px-2.5 sm:px-4 text-xs sm:text-base bg-transparent text-[#2D231E] placeholder:text-[#A8988C] focus:outline-none"
        />
        {filterOptions.searchQuery && (
          <button
            type="button"
            onClick={clearQuery}
            className="p-1.5 sm:p-2 mr-1 sm:mr-2 text-[#8C6D58] hover:text-[#2D231E] rounded-full hover:bg-[#F5ECE1] transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Quick Area Filters for Indralaya (Smooth Touch Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-[#8C6D58] font-bold text-[11px] flex items-center gap-1 shrink-0 mr-1">
          <MapPin className="w-3 h-3 text-[#C86D51]" />
          Area:
        </span>
        {[
          { label: 'Semua Area', value: '' },
          { label: 'Simpang Timbangan', value: 'Simpang Timbangan' },
          { label: 'Gang Lampung', value: 'Gang Lampung' },
          { label: 'Tanjung Senai', value: 'Tanjung Senai' },
          { label: 'Palem Raya', value: 'Palem Raya' },
          { label: 'Indralaya Raya', value: 'Indralaya Raya' },
        ].map((areaItem) => {
          const isActive =
            areaItem.value === ''
              ? !filterOptions.searchQuery
              : filterOptions.searchQuery?.toLowerCase().includes(areaItem.value.toLowerCase())

          return (
            <button
              key={areaItem.label}
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filterOptions,
                  searchQuery: areaItem.value,
                })
              }
              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-[#382E2B] text-white border-[#382E2B] shadow-2xs'
                  : 'bg-white text-[#5C4A3E] border-[#E8DFD3] hover:bg-[#F7EFE5]'
              }`}
            >
              {areaItem.label}
            </button>
          )
        })}
      </div>

      {/* Filter Chips / Quick Filters - Horizontal Scroll on Mobile, Wrapped on Desktop */}
      <div className="flex items-center sm:flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 text-xs">
        <span className="text-[#8C6D58] font-medium text-xs flex items-center gap-1 shrink-0">
          Filter:
        </span>

        {/* Filter Wi-Fi */}
        <button
          type="button"
          onClick={() => toggleFilter('fastWifiOnly')}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border transition-all shrink-0 text-xs ${filterOptions.fastWifiOnly
              ? 'bg-[#C86D51] text-white border-[#C86D51] shadow-xs'
              : 'bg-white text-[#5C4A3E] border-[#E8DFD3] hover:bg-[#F7EFE5]'
            }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>Wi-Fi Ngebut (≥4★)</span>
        </button>

        {/* Filter Colokan */}
        <button
          type="button"
          onClick={() => toggleFilter('manyOutletsOnly')}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border transition-all shrink-0 text-xs ${filterOptions.manyOutletsOnly
              ? 'bg-[#6B8E23] text-white border-[#6B8E23] shadow-xs'
              : 'bg-white text-[#5C4A3E] border-[#E8DFD3] hover:bg-[#F7EFE5]'
            }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Banyak Colokan 🔌</span>
        </button>

        {/* Filter Tenang */}
        <button
          type="button"
          onClick={() => toggleFilter('quietOnly')}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border transition-all shrink-0 text-xs ${filterOptions.quietOnly
              ? 'bg-[#6A7B76] text-white border-[#6A7B76] shadow-xs'
              : 'bg-white text-[#5C4A3E] border-[#E8DFD3] hover:bg-[#F7EFE5]'
            }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Suasana Hening 🌿</span>
        </button>

        {/* Filter Buka Malam */}
        <button
          type="button"
          onClick={() => toggleFilter('openLateOnly')}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border transition-all shrink-0 text-xs ${filterOptions.openLateOnly
              ? 'bg-[#8F5B80] text-white border-[#8F5B80] shadow-xs'
              : 'bg-white text-[#5C4A3E] border-[#E8DFD3] hover:bg-[#F7EFE5]'
            }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Buka Malam 🌙</span>
        </button>

        {/* Reset Filter Button */}
        {(filterOptions.fastWifiOnly ||
          filterOptions.manyOutletsOnly ||
          filterOptions.quietOnly ||
          filterOptions.openLateOnly ||
          filterOptions.searchQuery) && (
            <button
              type="button"
              onClick={() => onFilterChange({ sortBy: filterOptions.sortBy })}
              className="text-xs text-[#C86D51] hover:underline font-bold px-2 py-1 shrink-0"
            >
              Hapus Filter
            </button>
          )}
      </div>

      {/* Sort Filter Bar (Paling Baru vs Paling Banyak Favorit) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#EDE4D8]/80">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-[#8C6D58] flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#C86D51]" />
            Urutan:
          </span>
          <div className="inline-flex rounded-full bg-[#EFE7DE] p-1 border border-[#E2D5C5] shrink-0">
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filterOptions,
                  sortBy: 'newest',
                })
              }
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                filterOptions.sortBy === 'newest' || !filterOptions.sortBy
                  ? 'bg-white text-[#2D231E] shadow-xs'
                  : 'text-[#7A6B63] hover:text-[#2D231E]'
              }`}
            >
              <Clock className="w-3 h-3 text-[#C86D51]" />
              Paling Baru
            </button>
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filterOptions,
                  sortBy: 'most_popular',
                })
              }
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                filterOptions.sortBy === 'most_popular'
                  ? 'bg-[#C86D51] text-white shadow-xs'
                  : 'text-[#7A6B63] hover:text-[#2D231E]'
              }`}
            >
              <Heart
                className={`w-3 h-3 ${
                  filterOptions.sortBy === 'most_popular'
                    ? 'fill-white text-white'
                    : 'text-[#C86D51]'
                }`}
              />
              Paling Banyak Favorit
            </button>
          </div>
        </div>

        {/* Counter Total Tempat */}
        <span className="text-[11px] font-bold text-[#8C6D58] bg-[#F4ECE1] px-3 py-1.5 rounded-full border border-[#E5DACD] w-fit">
          {totalResults} tempat ditemukan
        </span>
      </div>

      
    </div>
  )
}

export default SearchBar
