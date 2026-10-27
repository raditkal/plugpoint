import React from 'react'
import { Search, X, Wifi, Zap, Volume2, Moon } from 'lucide-react'
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
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Search Input Box - Cozy Rounded 3XL with Warm Beige Border */}
      <div className="relative flex items-center rounded-3xl bg-white border-2 border-[#EADFCF] focus-within:border-[#C86D51] shadow-sm shadow-[#E3D7C8]/40 transition-all p-1">
        <div className="pl-4 sm:pl-5 text-[#8C6D58]">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={filterOptions.searchQuery || ''}
          onChange={handleQueryChange}
          placeholder="Cari kafe santai, perpustakaan, atau area (misal: Dago, Tebet)..."
          className="w-full py-3.5 sm:py-4 px-3 sm:px-4 text-sm sm:text-base bg-transparent text-[#2D231E] placeholder:text-[#A8988C] focus:outline-none"
        />
        {filterOptions.searchQuery && (
          <button
            type="button"
            onClick={clearQuery}
            className="p-2 mr-2 text-[#8C6D58] hover:text-[#2D231E] rounded-full hover:bg-[#F5ECE1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips / Quick Filters - Pastel Warm Cafe Aesthetic */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1 text-xs">
        <span className="text-[#8C6D58] font-medium mr-1 text-xs flex items-center gap-1">
          Pilihan santai:
        </span>

        {/* Filter Wi-Fi */}
        <button
          type="button"
          onClick={() => toggleFilter('fastWifiOnly')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all ${filterOptions.fastWifiOnly
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all ${filterOptions.manyOutletsOnly
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all ${filterOptions.quietOnly
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all ${filterOptions.openLateOnly
              ? 'bg-[#8F5B80] text-white border-[#8F5B80] shadow-xs'
              : 'bg-white text-[#5C4A3E] border-[#E8DFD3] hover:bg-[#F7EFE5]'
            }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Buka Sampai Malam 🌙</span>
        </button>

        {/* Reset Filter Button */}
        {(filterOptions.fastWifiOnly ||
          filterOptions.manyOutletsOnly ||
          filterOptions.quietOnly ||
          filterOptions.openLateOnly ||
          filterOptions.searchQuery) && (
            <button
              type="button"
              onClick={() => onFilterChange({})}
              className="text-xs text-[#C86D51] hover:underline font-semibold ml-auto px-2 py-1"
            >
              Hapus Filter
            </button>
          )}
      </div>

      {/* Result Count Info */}
      <div className="text-center sm:text-left text-xs text-[#8C6D58] font-medium pt-1">
        Ditemukan <span className="font-bold text-[#2D231E]">{totalResults}</span> tempat yang pas buat fokus nugas.
      </div>
    </div>
  )
}

export default SearchBar
