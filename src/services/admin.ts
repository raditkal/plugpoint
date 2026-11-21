import { supabase } from '../lib/supabase'
import type { Place, PlaceStatus, Report, ReportStatus } from '../types/place'

export interface ExtendedReport extends Report {
  places?: {
    name: string
    area: string
  } | null
}

// Fallback data simulasi untuk antrean pengajuan tempat
export const DUMMY_PENDING_PLACES: Place[] = [
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Kopi Kenangan Senja & Co',
    address: 'Jl. Riau No. 88, Citarum',
    area: 'Bandung',
    latitude: -6.9082,
    longitude: 107.6198,
    wifi_rating: 4,
    wifi_speed_mbps: 55,
    outlet_level: 'many',
    noise_level: 'moderate',
    opening_hours: {
      daily: { open: '08:00', close: '22:00', is_closed: false },
    },
    quiet_hours: '08:00 - 11:00',
    notes: 'Lantai 2 sangat nyaman untuk kerja remote. Banyak colokan di dekat jendela.',
    created_by: 'user-sample-1',
    status: 'pending',
    rejection_reason: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Perpustakaan Komunitas Cikini',
    address: 'Jl. Cikini Raya No. 45, Menteng',
    area: 'Jakarta Pusat',
    latitude: -6.1912,
    longitude: 106.8398,
    wifi_rating: 5,
    wifi_speed_mbps: 100,
    outlet_level: 'many',
    noise_level: 'quiet',
    opening_hours: {
      daily: { open: '09:00', close: '20:00', is_closed: false },
    },
    quiet_hours: 'Sepanjang hari',
    notes: 'Sangat hening, wajib pakai headphone, colokan ada di setiap meja bilik.',
    created_by: 'user-sample-2',
    status: 'pending',
    rejection_reason: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
]

// Fallback data simulasi untuk laporan
export const DUMMY_REPORTS: ExtendedReport[] = [
  {
    id: 'rep-001',
    place_id: '11111111-1111-1111-1111-111111111111',
    reporter_id: null,
    reason: 'inaccurate_wifi',
    description: 'Wi-Fi lantai 1 sedang diperbaiki, hanya lantai 2 yang aktif.',
    status: 'open',
    resolved_by: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    resolved_at: null,
    places: {
      name: 'Ruang Seduh & Kerja',
      area: 'Bandung',
    },
  },
  {
    id: 'rep-002',
    place_id: '33333333-3333-3333-3333-333333333333',
    reporter_id: null,
    reason: 'wrong_location',
    description: 'Pindah ruko ke nomor 124 tepat di sebelahnya.',
    status: 'reviewing',
    resolved_by: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    resolved_at: null,
    places: {
      name: 'Kopi Titik Koma Dago',
      area: 'Bandung',
    },
  },
]

let memoryPlaces = [...DUMMY_PENDING_PLACES]
let memoryReports = [...DUMMY_REPORTS]

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
      const filtered = statusFilter === 'all'
        ? memoryPlaces
        : memoryPlaces.filter((p) => p.status === statusFilter)
      return { data: filtered, isUsingFallback: true, error: null }
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
      const filtered = statusFilter === 'all'
        ? memoryReports
        : memoryReports.filter((r) => r.status === statusFilter)
      return { data: filtered, isUsingFallback: true, error: null }
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
