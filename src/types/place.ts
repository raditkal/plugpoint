import type { Database, OutletLevel, NoiseLevel, PlaceStatus, ReportStatus, ReportReason } from './database'

export type Place = Database['public']['Tables']['places']['Row'] & {
  profiles?: {
    id?: string
    display_name?: string
    contributor_status?: string
  } | null
  favorites_count?: number
}
export type PlaceInsert = Database['public']['Tables']['places']['Insert']
export type PlaceUpdate = Database['public']['Tables']['places']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type PlaceReview = Database['public']['Tables']['place_reviews']['Row'] & {
  profiles?: {
    id?: string
    display_name?: string
  } | null
}
export type PlaceReviewInsert = Database['public']['Tables']['place_reviews']['Insert']

export interface DaySchedule {
  open: string // Format "08:00"
  close: string // Format "22:00"
  is_closed: boolean
}

export type WeekSchedule = {
  [day in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']?: DaySchedule
}

export interface PlaceFilterOptions {
  searchQuery?: string
  sortBy?: 'most_popular' | 'newest' | 'fastest_wifi'
}

export type { OutletLevel, NoiseLevel, PlaceStatus, ReportStatus, ReportReason }
