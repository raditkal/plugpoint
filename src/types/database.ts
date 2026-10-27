export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ContributorStatus = 'unverified' | 'trusted'
export type PlaceStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision'
export type OutletLevel = 'few' | 'many' | 'unknown'
export type NoiseLevel = 'quiet' | 'moderate' | 'noisy' | 'unknown'
export type ReportReason =
  | 'wrong_location'
  | 'permanently_closed'
  | 'inaccurate_wifi'
  | 'inaccurate_outlets'
  | 'inappropriate_content'
  | 'duplicate_place'
  | 'other'
export type ReportStatus = 'open' | 'reviewing' | 'resolved'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          contributor_status: ContributorStatus
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          contributor_status?: ContributorStatus
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          contributor_status?: ContributorStatus
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      places: {
        Row: {
          id: string
          name: string
          address: string
          area: string
          latitude: number | null
          longitude: number | null
          wifi_rating: number | null
          wifi_speed_mbps: number | null
          outlet_level: OutletLevel
          noise_level: NoiseLevel
          opening_hours: Json | null
          quiet_hours: string | null
          notes: string | null
          created_by: string | null
          status: PlaceStatus
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          area: string
          latitude?: number | null
          longitude?: number | null
          wifi_rating?: number | null
          wifi_speed_mbps?: number | null
          outlet_level?: OutletLevel
          noise_level?: NoiseLevel
          opening_hours?: Json | null
          quiet_hours?: string | null
          notes?: string | null
          created_by?: string | null
          status?: PlaceStatus
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          area?: string
          latitude?: number | null
          longitude?: number | null
          wifi_rating?: number | null
          wifi_speed_mbps?: number | null
          outlet_level?: OutletLevel
          noise_level?: NoiseLevel
          opening_hours?: Json | null
          quiet_hours?: string | null
          notes?: string | null
          created_by?: string | null
          status?: PlaceStatus
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          place_id: string
          reporter_id: string | null
          reason: ReportReason
          description: string | null
          status: ReportStatus
          resolved_by: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          place_id: string
          reporter_id?: string | null
          reason: ReportReason
          description?: string | null
          status?: ReportStatus
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          place_id?: string
          reporter_id?: string | null
          reason?: ReportReason
          description?: string | null
          status?: ReportStatus
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      place_reviews: {
        Row: {
          id: string
          place_id: string
          user_id: string
          wifi_rating: number | null
          outlet_rating: number | null
          noise_rating: number | null
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          place_id: string
          user_id: string
          wifi_rating?: number | null
          outlet_rating?: number | null
          noise_rating?: number | null
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          place_id?: string
          user_id?: string
          wifi_rating?: number | null
          outlet_rating?: number | null
          noise_rating?: number | null
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
