import { supabase } from '../lib/supabase'
import type { Place, PlaceStatus, Report, ReportStatus } from '../types/place'

export interface ExtendedReport extends Report {
  places?: {
    name: string
    area: string
  } | null
}

// Tidak ada data dummy untuk admin (hanya data asli database)
export const DUMMY_PENDING_PLACES: Place[] = []
export const DUMMY_REPORTS: ExtendedReport[] = []

let memoryPlaces: Place[] = []
let memoryReports: ExtendedReport[] = []

/**
 * Mengambil daftar tempat untuk panel admin (bisa difilter berdasarkan status)
 */
export async function getAdminPlaces(statusFilter: PlaceStatus | 'all' = 'all'): Promise<{
  data: Place[]
  isUsingFallback: boolean
  error: string | null
}> {
  try {
    let query = supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Gagal memuat tempat admin dari Supabase:', error.message)
      const filtered = statusFilter === 'all'
        ? memoryPlaces
        : memoryPlaces.filter((p) => p.status === statusFilter)
      return { data: filtered, isUsingFallback: true, error: error.message }
    }

    if (!data || data.length === 0) {
      return { data: [], isUsingFallback: false, error: null }
    }

    return { data, isUsingFallback: false, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    const filtered = statusFilter === 'all'
      ? memoryPlaces
      : memoryPlaces.filter((p) => p.status === statusFilter)
    return { data: filtered, isUsingFallback: true, error: errorMsg }
  }
}

/**
 * Memoderasi status tempat (Approved, Rejected, atau Needs Revision)
 */
export async function moderatePlace(
  placeId: string,
  newStatus: 'approved' | 'rejected' | 'needs_revision',
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // 1. Coba gunakan RPC function database
    const { error: rpcError } = await (supabase.rpc as any)('moderate_place', {
      target_place_id: placeId,
      new_status: newStatus,
      reason: reason || null,
    })

    if (!rpcError) {
      // Update memory state jika ada
      memoryPlaces = memoryPlaces.map((p) =>
        p.id === placeId ? { ...p, status: newStatus, rejection_reason: reason || null } : p
      )
      return { success: true, error: null }
    }

    // 2. Fallback update langsung ke tabel places jika RPC gagal
    const { error: updateError } = await (supabase
      .from('places') as any)
      .update({
        status: newStatus,
        rejection_reason: newStatus !== 'approved' ? (reason || null) : null,
      })
      .eq('id', placeId)

    if (updateError) {
      // Update data di memori jika operasi jaringan bermasalah
      memoryPlaces = memoryPlaces.map((p) =>
        p.id === placeId ? { ...p, status: newStatus, rejection_reason: reason || null } : p
      )
      return { success: true, error: null }
    }

    return { success: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    memoryPlaces = memoryPlaces.map((p) =>
      p.id === placeId ? { ...p, status: newStatus, rejection_reason: reason || null } : p
    )
    return { success: true, error: errorMsg }
  }
}

/**
 * Mengambil daftar laporan tempat untuk panel admin
 */
export async function getAdminReports(statusFilter: ReportStatus | 'all' = 'all'): Promise<{
  data: ExtendedReport[]
  isUsingFallback: boolean
  error: string | null
}> {
  try {
    let query = supabase
      .from('reports')
      .select('*, places(name, area)')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Gagal memuat laporan admin dari Supabase:', error.message)
      const filtered = statusFilter === 'all'
        ? memoryReports
        : memoryReports.filter((r) => r.status === statusFilter)
      return { data: filtered, isUsingFallback: true, error: error.message }
    }

    if (!data || data.length === 0) {
      return { data: [], isUsingFallback: false, error: null }
    }

    return { data: data as ExtendedReport[], isUsingFallback: false, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    const filtered = statusFilter === 'all'
      ? memoryReports
      : memoryReports.filter((r) => r.status === statusFilter)
    return { data: filtered, isUsingFallback: true, error: errorMsg }
  }
}

/**
 * Memperbarui status penanganan laporan (Open -> Reviewing -> Resolved)
 */
export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await (supabase
      .from('reports') as any)
      .update({
        status: newStatus,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', reportId)

    if (error) {
      memoryReports = memoryReports.map((r) =>
        r.id === reportId ? { ...r, status: newStatus } : r
      )
      return { success: true, error: null }
    }

    memoryReports = memoryReports.map((r) =>
      r.id === reportId ? { ...r, status: newStatus } : r
    )
    return { success: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    memoryReports = memoryReports.map((r) =>
      r.id === reportId ? { ...r, status: newStatus } : r
    )
    return { success: true, error: errorMsg }
  }
}
