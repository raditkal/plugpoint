import React from 'react'
import { Search, X, Flame, Sparkles, Wifi, MapPin } from 'lucide-react'
import type { PlaceFilterOptions } from '../types/place'

interface SearchBarProps {
  filterOptions: PlaceFilterOptions
  onFilterChange: (newOptions: PlaceFilterOptions) => void
  totalResults: number
}

const SORT_OPTIONS: {
  key: 'most_popular' | 'newest' | 'fastest_wifi'
  label: string
  icon: React.ReactNode
}[] = [
  {
    key: 'most_popular',
    label: 'Paling Populer',
    icon: <Flame className="w-3.5 h-3.5" />,
  },
  {
    key: 'newest',
    label: 'Paling Baru',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  {
    key: 'fastest_wifi',
    label: 'Wi-Fi Paling Kenceng',
    icon: <Wifi className="w-3.5 h-3.5" />,
  },
]

export const SearchBar: React.FC<SearchBarProps> = ({
  filterOptions,
  onFilterChange,
  totalResults,
}) => {
  const currentSort = filterOptions.sortBy || 'most_popular'

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

  const handleSortChange = (key: 'most_popular' | 'newest' | 'fastest_wifi') => {
    onFilterChange({
      ...filterOptions,
      sortBy: key,
    })
  }

  const isFiltered = Boolean(
    (filterOptions.searchQuery && filterOptions.searchQuery.trim() !== '') ||
    (filterOptions.sortBy && filterOptions.sortBy !== 'most_popular')
  )

  const handleReset = () => {
    onFilterChange({
      sortBy: 'most_popular',
      searchQuery: '',
    })
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-3.5">
      {/* Search Input Box */}
      <div className="relative flex items-center rounded-3xl bg-white border-2 border-[#EADFCF] focus-within:border-[#C86D51] shadow-sm shadow-[#E3D7C8]/40 transition-all p-1">
        <div className="pl-3.5 sm:pl-5 text-[#8C6D58] shrink-0">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <input
          type="text"
          value={filterOptions.searchQuery || ''}
          onChange={handleQueryChange}
          placeholder="Cari dari nama atau lokasi..."
          className="w-full py-2.5 sm:py-3.5 px-2.5 sm:px-4 text-xs sm:text-base bg-transparent text-[#2D231E] placeholder:text-[#A8988C] focus:outline-none"
        />
        {filterOptions.searchQuery && (
          <button
            type="button"
            onClick={clearQuery}
            className="p-1.5 sm:p-2 mr-1 sm:mr-2 text-[#8C6D58] hover:text-[#2D231E] rounded-full hover:bg-[#F5ECE1] transition-colors shrink-0 cursor-pointer"
            title="Hapus pencarian"
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

      {/* 3 Main Sort / Filter Options Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1.5 border-t border-[#EDE4D8]/80">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex items-center gap-1 bg-[#F1E9DF] p-1 rounded-full border border-[#E4D8C8] shrink-0">
            {SORT_OPTIONS.map((tab) => {
              const isActive = currentSort === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleSortChange(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#C86D51] text-white shadow-xs'
                      : 'text-[#6B5A51] hover:text-[#2D231E] hover:bg-[#E7DDD0]/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#C86D51] hover:underline font-bold px-2 py-1 shrink-0 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Counter Total Tempat */}
        <span className="text-[11px] font-bold text-[#8C6D58] bg-[#F4ECE1] px-3 py-1.5 rounded-full border border-[#E5DACD] w-fit self-start sm:self-auto shrink-0">
          {totalResults} tempat ditemukan
        </span>
      </div>
    </div>
  )
}

export default SearchBar
