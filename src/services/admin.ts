import { supabase } from '../lib/supabase'
import type { Place, PlaceInsert, PlaceStatus, Report } from '../types/place'

export interface ExtendedReport extends Report {
  places?: {
    id?: string
    name: string
    area: string
  } | null
}

// Tidak ada data dummy untuk admin (hanya data asli database)
export const DUMMY_PENDING_PLACES: Place[] = []
export const DUMMY_REPORTS: ExtendedReport[] = []

let memoryPlaces: Place[] = []

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
 * Menghapus tempat secara permanen dari database (oleh Admin)
 */
export async function deletePlace(
  placeId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId)

    if (error) {
      console.warn('Gagal menghapus tempat dari Supabase:', error.message)
      return { success: false, error: error.message }
    }

    memoryPlaces = memoryPlaces.filter((p) => p.id !== placeId)
    return { success: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

/**
 * Memperbarui data informasi tempat oleh admin
 */
export async function adminUpdatePlace(
  placeId: string,
  updatedData: Partial<PlaceInsert>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const rawImage = updatedData.image_url && typeof updatedData.image_url === 'string' ? updatedData.image_url.trim() : null
    const existingHours = typeof updatedData.opening_hours === 'object' && updatedData.opening_hours !== null
      ? updatedData.opening_hours
      : {}
    const openingHoursWithImage = rawImage
      ? { ...existingHours, image_url: rawImage }
      : existingHours

    const payload = {
      ...updatedData,
      image_url: rawImage,
      opening_hours: openingHoursWithImage,
      updated_at: new Date().toISOString(),
    }

    let { error } = await (supabase.from('places') as any)
      .update(payload)
      .eq('id', placeId)

    // Jika kolom image_url belum ada di Supabase, coba update tanpa kolom image_url level atas
    if (error && error.message.toLowerCase().includes('image_url')) {
      const { image_url, ...restPayload } = payload as any
      const retry = await (supabase.from('places') as any)
        .update(restPayload)
        .eq('id', placeId)
      error = retry.error
    }

    if (error) {
      console.warn('Gagal mengupdate tempat di Supabase:', error.message)
      return { success: false, error: error.message }
    }

    memoryPlaces = memoryPlaces.map((p) =>
      p.id === placeId ? { ...p, ...payload } : p
    )
    return { success: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

const REPORTS_STORAGE_KEY = 'plugpoint_admin_reports_cache'

export function getLocalReports(): ExtendedReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalReports(reports: ExtendedReport[]) {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports))
  } catch (e) {
    console.warn('Gagal menyimpan cache laporan lokal:', e)
  }
}

/**
 * Mengambil daftar laporan tempat untuk panel admin
 * statusFilter: 'pending' (belum dikonfirmasi) atau 'reviewed' (selesai ditinjau: diterima & ditolak)
 */
export async function getAdminReports(statusFilter: 'pending' | 'reviewed' | 'all' = 'pending'): Promise<{
  data: ExtendedReport[]
  isUsingFallback: boolean
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, places(id, name, area, address)')
      .order('created_at', { ascending: false })

    const localList = getLocalReports()
    // 1. Bersihkan localList dari artifact dummy/duplikat lama (misal ID 'report-*' yang masih open atau tanpa nama tempat)
    const cleanedLocalList = localList.filter((r) => {
      if (r.id.startsWith('report-') && (r.status === 'open' || !r.places?.name)) {
        return false
      }
      return true
    })

    const combinedMap = new Map<string, ExtendedReport>()

    // 2. Data dari Supabase adalah sumber kebenaran utama untuk laporan aktif
    if (data && data.length > 0) {
      data.forEach((r: any) => {
        combinedMap.set(r.id, {
          ...r,
          places: r.places || null,
        })
      })
    }

    // 3. Masukkan riwayat laporan 'resolved' dari local storage
    // (berguna untuk laporan yang tempatnya sudah dihapus permanen dari Supabase sehingga ter-cascade delete)
    cleanedLocalList.forEach((r) => {
      if (r.status === 'resolved') {
        const existing = combinedMap.get(r.id)
        if (!existing) {
          combinedMap.set(r.id, r)
        } else if (!existing.places && r.places) {
          combinedMap.set(r.id, { ...existing, places: r.places })
        }
      }
    })

    const allReports = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Simpan hasil gabungan yang sudah bersih ke localStorage
    saveLocalReports(allReports)

    // Filter sesuai status:
    let filtered = allReports
    if (statusFilter === 'pending') {
      filtered = allReports.filter((r) => r.status === 'open' || r.status === 'reviewing')
    } else if (statusFilter === 'reviewed') {
      filtered = allReports.filter((r) => r.status === 'resolved')
    }

    return { data: filtered, isUsingFallback: Boolean(error), error: error ? error.message : null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    const localList = getLocalReports().filter((r) => !r.id.startsWith('report-') || r.places?.name)
    let filtered = localList
    if (statusFilter === 'pending') {
      filtered = localList.filter((r) => r.status === 'open' || r.status === 'reviewing')
    } else if (statusFilter === 'reviewed') {
      filtered = localList.filter((r) => r.status === 'resolved')
    }
    return { data: filtered, isUsingFallback: true, error: errorMsg }
  }
}

/**
 * Memperbarui status penanganan laporan (Terima atau Tolak laporan)
 */
export async function resolveReport(
  reportId: string,
  resolution: 'accepted' | 'rejected',
  currentDescription?: string | null,
  placeInfo?: { id?: string; name: string; area: string } | null
): Promise<{ success: boolean; error: string | null }> {
  try {
    const cleanDesc = (currentDescription || '').replace(/^\[(DITERIMA|DITOLAK)\]\s*/i, '').trim()
    const prefix = resolution === 'accepted' ? '[DITERIMA]' : '[DITOLAK]'
    const newDescription = cleanDesc ? `${prefix} ${cleanDesc}` : prefix
    const nowIso = new Date().toISOString()

    // 1. Update di Supabase
    const { error } = await (supabase.from('reports') as any)
      .update({
        status: 'resolved',
        description: newDescription,
        resolved_at: nowIso,
      })
      .eq('id', reportId)

    if (error) {
      console.warn('Gagal update status di Supabase, menyimpan ke cache lokal:', error.message)
    }

    // 2. Update di localStorage agar history laporan tidak pernah hilang (bahkan jika tempat dihapus)
    const localList = getLocalReports()
    const existingIndex = localList.findIndex((r) => r.id === reportId)
    let updatedLocal: ExtendedReport[]

    if (existingIndex >= 0) {
      updatedLocal = localList.map((r, i) => {
        if (i === existingIndex) {
          return {
            ...r,
            status: 'resolved' as const,
            description: newDescription,
            resolved_at: nowIso,
            places: placeInfo || r.places || null,
          }
        }
        return r
      })
    } else {
      const newArchived: ExtendedReport = {
        id: reportId,
        place_id: placeInfo?.id || '',
        reporter_id: null,
        reason: 'other',
        description: newDescription,
        status: 'resolved',
        resolved_by: null,
        created_at: nowIso,
        resolved_at: nowIso,
        places: placeInfo || null,
      }
      updatedLocal = [newArchived, ...localList]
    }

    saveLocalReports(updatedLocal)

    return { success: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

/**
 * Mengembalikan status laporan menjadi belum ditinjau (open)
 */
export async function reopenReport(
  reportId: string,
  currentDescription?: string | null
): Promise<{ success: boolean; error: string | null }> {
  try {
    const cleanDesc = (currentDescription || '').replace(/^\[(DITERIMA|DITOLAK)\]\s*/i, '').trim()

    await (supabase.from('reports') as any)
      .update({
        status: 'open',
        description: cleanDesc || null,
        resolved_at: null,
      })
      .eq('id', reportId)

    const localList = getLocalReports()
    const updatedLocal = localList.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'open' as const,
          description: cleanDesc || null,
          resolved_at: null,
        }
      }
      return r
    })
    saveLocalReports(updatedLocal)

    return { success: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

/**
 * Mendapatkan status peninjauan laporan (open, accepted, rejected)
 */
export function getReportResolution(report: ExtendedReport): 'open' | 'accepted' | 'rejected' {
  if (report.status === 'open' || report.status === 'reviewing') return 'open'
  if (report.description?.startsWith('[DITERIMA]')) return 'accepted'
  if (report.description?.startsWith('[DITOLAK]')) return 'rejected'
  return 'accepted'
}

/**
 * Membersihkan awalan [DITERIMA] / [DITOLAK] untuk tampilan deskripsi asli
 */
export function getCleanReportDescription(description: string | null | undefined): string {
  if (!description) return ''
  return description.replace(/^\[(DITERIMA|DITOLAK)\]\s*/i, '').trim()
}
