import type { Database, OutletLevel, NoiseLevel, PlaceStatus } from './database'

export type Place = Database['public']['Tables']['places']['Row']
export type PlaceInsert = Database['public']['Tables']['places']['Insert']
export type PlaceUpdate = Database['public']['Tables']['places']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type PlaceReview = Database['public']['Tables']['place_reviews']['Row']

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
  fastWifiOnly?: boolean // wifi_rating >= 4
  manyOutletsOnly?: boolean // outlet_level === 'many'
  quietOnly?: boolean // noise_level === 'quiet'
  openLateOnly?: boolean // buka melewati jam 21:00
}

export type { OutletLevel, NoiseLevel, PlaceStatus }
