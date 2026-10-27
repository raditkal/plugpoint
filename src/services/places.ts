import { supabase } from '../lib/supabase'
import type { Place, PlaceFilterOptions } from '../types/place'

// Data fallback/dummy realistis jika database Supabase belum diisi tempat
export const DUMMY_PLACES: Place[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Ruang Seduh & Kerja',
    address: 'Jl. Dipati Ukur No. 45, Lebakgede',
    area: 'Bandung',
    latitude: -6.8925,
    longitude: 107.6186,
    wifi_rating: 5,
    wifi_speed_mbps: 85,
    outlet_level: 'many',
    noise_level: 'quiet',
    opening_hours: {
      daily: { open: '08:00', close: '23:00', is_closed: false }
    },
    quiet_hours: '08:00 - 14:00',
    notes: 'Colokan di hampir setiap meja, kursi ergonomis, dan playlist lofi tenang.',
    created_by: null,
    status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Kolektif Coworking Space',
    address: 'Jl. Wolter Monginsidi No. 12, Kebayoran Baru',
    area: 'Jakarta Selatan',
    latitude: -6.2382,
    longitude: 106.8124,
    wifi_rating: 5,
    wifi_speed_mbps: 120,
    outlet_level: 'many',
    noise_level: 'quiet',
    opening_hours: {
      daily: { open: '07:30', close: '22:00', is_closed: false }
    },
    quiet_hours: 'Sepanjang hari',
    notes: 'Ada bilik telepon peredam suara untuk meeting online dan free flow kopi.',
    created_by: null,
    status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Kopi Titik Koma Dago',
    address: 'Jl. Ir. H. Juanda No. 120, Dago',
    area: 'Bandung',
    latitude: -6.8856,
    longitude: 107.6143,
    wifi_rating: 4,
    wifi_speed_mbps: 45,
    outlet_level: 'many',
    noise_level: 'moderate',
    opening_hours: {
      daily: { open: '09:00', close: '23:30', is_closed: false }
    },
    quiet_hours: '09:00 - 12:00',
    notes: 'Lantai 2 khusus area laptop. Suasana ramai santai saat sore hari.',
    created_by: null,
    status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Selasar Pustaka & Cafe',
    address: 'Jl. Kaliurang KM 5.5, Depok',
    area: 'Sleman, Yogyakarta',
    latitude: -7.7612,
    longitude: 110.3811,
    wifi_rating: 4,
    wifi_speed_mbps: 50,
    outlet_level: 'few',
    noise_level: 'quiet',
    opening_hours: {
      daily: { open: '10:00', close: '24:00', is_closed: false }
    },
    quiet_hours: '13:00 - 18:00',
    notes: 'Suasana sangat sunyi cocok untuk skripsi/membaca. Colokan terbatas di area dinding.',
    created_by: null,
    status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Midnight Study Hub',
    address: 'Jl. Gejayan No. 8, Condongcatur',
    area: 'Yogyakarta',
    latitude: -7.7712,
    longitude: 110.3905,
    wifi_rating: 4,
    wifi_speed_mbps: 60,
    outlet_level: 'many',
    noise_level: 'quiet',
    opening_hours: {
      daily: { open: '10:00', close: '03:00', is_closed: false }
    },
    quiet_hours: '21:00 - 03:00',
    notes: 'Buka sampai dini hari jam 03.00, colokan per orang ada 2 lubang.',
    created_by: null,
    status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
]

/**
 * Mengambil daftar tempat kerja yang disetujui dari database Supabase
 * dengan opsi pencarian dan filter.
 */
export async function getPlaces(options: PlaceFilterOptions = {}): Promise<{
  data: Place[]
  isUsingFallback: boolean
  error: string | null
}> {
  try {
    let query = supabase
      .from('places')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (options.searchQuery && options.searchQuery.trim() !== '') {
      const q = `%${options.searchQuery.trim()}%`
      query = query.or(`name.ilike.${q},area.ilike.${q},address.ilike.${q}`)
    }

    if (options.fastWifiOnly) {
      query = query.gte('wifi_rating', 4)
    }

    if (options.manyOutletsOnly) {
      query = query.eq('outlet_level', 'many')
    }

    if (options.quietOnly) {
      query = query.eq('noise_level', 'quiet')
    }

    const { data, error } = await query

    if (error) {
      console.warn('Gagal mengambil data dari Supabase, beralih ke data fallback:', error.message)
      return {
        data: applyClientFilter(DUMMY_PLACES, options),
        isUsingFallback: true,
        error: error.message
      }
    }

    // Jika Supabase terhubung tapi tabel places masih kosong, gunakan dummy data sementara
    if (!data || data.length === 0) {
      return {
        data: applyClientFilter(DUMMY_PLACES, options),
        isUsingFallback: true,
        error: null
      }
    }

    return {
      data,
      isUsingFallback: false,
      error: null
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return {
      data: applyClientFilter(DUMMY_PLACES, options),
      isUsingFallback: true,
      error: errorMsg
    }
  }
}

/**
 * Filter lokal untuk data fallback jika database belum berisi data
 */
function applyClientFilter(places: Place[], options: PlaceFilterOptions): Place[] {
  let result = [...places]

  if (options.searchQuery && options.searchQuery.trim() !== '') {
    const q = options.searchQuery.toLowerCase()
    result = result.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    )
  }

  if (options.fastWifiOnly) {
    result = result.filter(p => (p.wifi_rating ?? 0) >= 4)
  }

  if (options.manyOutletsOnly) {
    result = result.filter(p => p.outlet_level === 'many')
  }

  if (options.quietOnly) {
    result = result.filter(p => p.noise_level === 'quiet')
  }

  if (options.openLateOnly) {
    result = result.filter(p => {
      // Periksa jam tutup > 21:00 atau jam dini hari (00:00 - 05:00)
      const hours = p.opening_hours as { daily?: { close?: string } } | null
      const close = hours?.daily?.close
      if (!close) return false
      const [hour] = close.split(':').map(Number)
      return hour >= 21 || hour <= 4
    })
  }

  return result
}
