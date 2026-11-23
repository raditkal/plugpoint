import { supabase } from '../lib/supabase'
import type { Place, PlaceInsert, PlaceFilterOptions, PlaceReview, ReportReason } from '../types/place'

// Daftar Area Khusus Indralaya (Ogan Ilir)
export const INDRALAYA_AREAS = [
  'Simpang Timbangan (KM 32)',
  'Gang Lampung & Sekitarnya',
  'Tanjung Sejaro',
  'Palem Raya',
  'Sakatiga',
  'Indralaya Raya',
  'Indralaya Indah',
  'Indralaya Mulya',
  'Tanjung Senai',
  'Arah Palembang (KM 32 – KM 35)',
] as const

export type IndralayaArea = typeof INDRALAYA_AREAS[number]

// Tidak ada data dummy (hanya data asli database)
export const DUMMY_PLACES: Place[] = []

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
      .select('*, profiles:created_by(id, display_name, contributor_status)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (options.searchQuery && options.searchQuery.trim() !== '') {
      const q = `%${options.searchQuery.trim()}%`
      query = query.or(`name.ilike.${q},area.ilike.${q},address.ilike.${q}`)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Gagal mengambil data dari Supabase:', error.message)
      return {
        data: [],
        isUsingFallback: false,
        error: error.message
      }
    }

    // Jika Supabase terhubung tapi belum ada tempat terdaftar
    if (!data || data.length === 0) {
      return {
        data: [],
        isUsingFallback: false,
        error: null
      }
    }

    const sortBy = options.sortBy || 'most_popular'
    const sortedData = [...(data as Place[])]
    if (sortBy === 'most_popular') {
      sortedData.sort((a, b) => {
        const favDiff = (b.favorites_count || 0) - (a.favorites_count || 0)
        if (favDiff !== 0) return favDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } else if (sortBy === 'fastest_wifi') {
      sortedData.sort((a, b) => {
        const speedA = a.wifi_speed_mbps || (a.wifi_rating ? a.wifi_rating * 15 : 0)
        const speedB = b.wifi_speed_mbps || (b.wifi_rating ? b.wifi_rating * 15 : 0)
        if (speedB !== speedA) return speedB - speedA
        return (b.wifi_rating || 0) - (a.wifi_rating || 0)
      })
    } else {
      // 'newest'
      sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return {
      data: sortedData,
      isUsingFallback: false,
      error: null
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return {
      data: [],
      isUsingFallback: false,
      error: errorMsg
    }
  }
}

/**
 * Mengubah UUID panjang menjadi short ID (8 karakter) yang ringkas dan ramah URL
 */
export function getShortId(id: string): string {
  if (!id) return ''
  return id.split('-')[0]
}

/**
 * Format tanggal penambahan tempat ke format relatif ramah bahasa Indonesia
 * (contoh: "Baru saja", "3 jam lalu", "Kemarin", "2 hari lalu", "3 minggu lalu", "15 Nov 2026")
 */
export function formatAddedDate(dateString?: string | null): string {
  if (!dateString) return 'Baru saja'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Baru saja'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    // Jika perbedaan negatif (toleransi perbedaan jam server/client)
    if (diffMs < 0) return 'Baru saja'

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 5) return 'Baru saja'
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} minggu lalu`
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} bulan lalu`
    }
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return 'Baru saja'
  }
}

/**
 * Format tanggal lengkap bahasa Indonesia (contoh: "15 November 2026")
 */
export function formatFullDate(dateString?: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

export interface SimilarPlaceMatch {
  isSimilar: boolean
  matchedPlace: Place | null
  similarityPercent: number
  matchedWords: string[]
  totalCandidateWords: number
  totalExistingWords: number
  message: string
}

/**
 * Menghitung jarak Levenshtein antara dua string (jumlah operasi insert, delete, substitution)
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prevRow = new Array(n + 1)
  let currRow = new Array(n + 1)

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i
    const charA = a[i - 1]

    for (let j = 1; j <= n; j++) {
      const charB = b[j - 1]
      const cost = charA === charB ? 0 : 1
      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      )
    }

    for (let j = 0; j <= n; j++) {
      prevRow[j] = currRow[j]
    }
  }

  return prevRow[n]
}

/**
 * Menghitung rasio kemiripan ejaan karakter antara dua string (0.0 - 1.0)
 */
export function stringSimilarity(a: string, b: string): number {
  const strA = a.trim().toLowerCase()
  const strB = b.trim().toLowerCase()
  if (strA === strB) return 1.0
  const maxLen = Math.max(strA.length, strB.length)
  if (maxLen === 0) return 1.0
  const dist = levenshteinDistance(strA, strB)
  return Math.max(0, 1 - dist / maxLen)
}

/**
 * Memeriksa apakah dua kata cocok secara persis atau merupakan typo tipis (Levenshtein)
 */
function isFuzzyWordMatch(w1: string, w2: string): { isMatch: boolean; displayWord: string } {
  if (w1 === w2) {
    return { isMatch: true, displayWord: w1 }
  }

  const minLen = Math.min(w1.length, w2.length)
  const maxLen = Math.max(w1.length, w2.length)
  const dist = levenshteinDistance(w1, w2)

  // Kata sangat pendek (<= 3 karakter, misal "dan", "tea"): harus persis sama
  if (minLen <= 3) {
    return { isMatch: false, displayWord: '' }
  }

  // Kata sedang (4 - 6 karakter): toleransi 1 karakter typo (misal "kopken" vs "kopkenn")
  if (minLen >= 4 && dist === 1) {
    return { isMatch: true, displayWord: `${w1} ≈ ${w2}` }
  }

  // Kata panjang (>= 7 karakter): toleransi typo hingga 2 karakter atau kemiripan >= 75%
  // Contoh: "khopkenn" (8) vs "kopkenn" (7) -> dist 1 -> cocok!
  // "starbuks" vs "starbucks" -> cocok!
  if (minLen >= 7 && (dist <= 2 || (1 - dist / maxLen >= 0.75))) {
    return { isMatch: true, displayWord: `${w1} ≈ ${w2}` }
  }

  return { isMatch: false, displayWord: '' }
}

/**
 * Normalisasi nama tempat untuk perbandingan kata (lowercase, hapus simbol selain alfanumerik)
 */
export function normalizePlaceName(name: string): string[] {
  if (!name) return []
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0)
}

/**
 * Mendeteksi apakah nama tempat baru memiliki kemiripan kata (word overlap) atau typo ejaan dengan tempat yang sudah ada.
 * Kriteria kemiripan:
 * 1. Typo ejaan nama penuh (misal: "Khopkenn" vs "Kopkenn" beda 1 huruf 'h' = 88% kemiripan)
 * 2. Overlap kata >= 60% (contoh: "Kopi Titik Koma Dago" vs "Kopi Titik Koma" = 75%, "Kolektif Coworking" vs "Kolektif Coworking Space" = 66.7%)
 * 3. Kesamaan nama brand 2 kata dengan 1 kata sama (50%, contoh: "Starbucks Sudirman" vs "Starbucks Kuningan")
 * 4. Tidak memicu warning jika overlap < 50% dan tidak ada typo (contoh: "Ruang Baca Santai" vs "Ruang Seduh & Kerja" = 33%)
 */
export function findSimilarPlace(
  newName: string,
  existingPlaces: Place[],
  excludePlaceId?: string
): SimilarPlaceMatch {
  const cleanNew = normalizePlaceName(newName)
  if (cleanNew.length === 0) {
    return {
      isSimilar: false,
      matchedPlace: null,
      similarityPercent: 0,
      matchedWords: [],
      totalCandidateWords: 0,
      totalExistingWords: 0,
      message: '',
    }
  }

  const rawNew = cleanNew.join(' ')
  let highestScore = 0
  let mostSimilarPlace: Place | null = null
  let bestMatchedWords: string[] = []
  let bestExistingLen = 0

  for (const place of existingPlaces) {
    if (excludePlaceId && place.id === excludePlaceId) continue

    const cleanExisting = normalizePlaceName(place.name)
    if (cleanExisting.length === 0) continue

    const rawExisting = cleanExisting.join(' ')

    // 1. Cek kemiripan string penuh (Levenshtein — mendeteksi typo seperti "Khopkenn" vs "Kopkenn")
    const fullSimilarity = stringSimilarity(rawNew, rawExisting)
    const fullScore = Math.round(fullSimilarity * 100)

    // 2. Cek kesamaan kata demi kata (termasuk toleransi typo kata)
    const matchedWordsList: string[] = []
    let matchCount = 0

    for (const wNew of cleanNew) {
      for (const wExisting of cleanExisting) {
        const fuzzy = isFuzzyWordMatch(wNew, wExisting)
        if (fuzzy.isMatch) {
          matchCount++
          matchedWordsList.push(fuzzy.displayWord)
          break // Pasangkan 1 kata baru dengan 1 kata existing
        }
      }
    }

    const maxLen = Math.max(cleanNew.length, cleanExisting.length)
    const minLen = Math.min(cleanNew.length, cleanExisting.length)

    const wordOverlapRatio = matchCount / maxLen
    const minOverlapRatio = matchCount / minLen
    const wordScore = Math.round(Math.max(wordOverlapRatio, minOverlapRatio) * 100)

    // Kriteria deteksi:
    // A. Kemiripan string penuh >= 75% (contoh: "Khopkenn" vs "Kopkenn" beda 1 huruf = 88%)
    // B. Word overlap >= 60% (contoh: 3 dari 4 kata, 2 dari 3 kata)
    // C. Nama pendek 2 kata yang memiliki 1 kata sama/mirip (50%, contoh: "Starbucks Sudirman" vs "Starbucks Kuningan")
    const isFullStringMatch = fullSimilarity >= 0.75
    const isWordOverlapMatch = wordOverlapRatio >= 0.6 || (minOverlapRatio >= 0.5 && minLen <= 2)

    if (isFullStringMatch || isWordOverlapMatch) {
      // Hitung skor akhir yang paling representatif
      let effectiveScore = wordScore
      if (isFullStringMatch && minLen === 1) {
        effectiveScore = fullScore
      } else {
        effectiveScore = Math.max(fullScore, wordScore)
      }

      if (effectiveScore > highestScore) {
        highestScore = effectiveScore
        mostSimilarPlace = place
        bestMatchedWords =
          matchedWordsList.length > 0
            ? Array.from(new Set(matchedWordsList))
            : [rawNew !== rawExisting ? `${rawNew} ≈ ${rawExisting}` : rawNew]
        bestExistingLen = cleanExisting.length
      }
    }
  }

  if (mostSimilarPlace && highestScore > 0) {
    return {
      isSimilar: true,
      matchedPlace: mostSimilarPlace,
      similarityPercent: highestScore,
      matchedWords: bestMatchedWords,
      totalCandidateWords: cleanNew.length,
      totalExistingWords: bestExistingLen,
      message: `Peringatan: Nama mirip dengan tempat terdaftar "${mostSimilarPlace.name}" (${highestScore}% kesamaan ejaan/kata)`,
    }
  }

  return {
    isSimilar: false,
    matchedPlace: null,
    similarityPercent: 0,
    matchedWords: [],
    totalCandidateWords: cleanNew.length,
    totalExistingWords: 0,
    message: '',
  }
}

/**
 * Mengambil detail satu tempat berdasarkan ID (bisa Full UUID atau Short ID 8 karakter)
 * dari Supabase
 */
export async function getPlaceById(id: string): Promise<{
  data: Place | null
  isUsingFallback: boolean
  error: string | null
}> {
  try {
    const cleanId = id.trim().toLowerCase()
    const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)

    let query = supabase.from('places').select('*, profiles:created_by(id, display_name, contributor_status)')

    if (isFullUuid) {
      query = query.eq('id', cleanId)
    } else if (/^[0-9a-f]{4,12}$/i.test(cleanId)) {
      // Range query untuk UUID prefix di PostgreSQL tanpa perlu cast text
      const padZero = `${cleanId}${'0'.repeat(32 - cleanId.length)}`
      const padF = `${cleanId}${'f'.repeat(32 - cleanId.length)}`
      const minUuid = `${padZero.slice(0, 8)}-${padZero.slice(8, 12)}-${padZero.slice(12, 16)}-${padZero.slice(16, 20)}-${padZero.slice(20, 32)}`
      const maxUuid = `${padF.slice(0, 8)}-${padF.slice(8, 12)}-${padF.slice(12, 16)}-${padF.slice(16, 20)}-${padF.slice(20, 32)}`
      query = query.gte('id', minUuid).lte('id', maxUuid)
    } else {
      return {
        data: null,
        isUsingFallback: false,
        error: 'ID tempat tidak ditemukan',
      }
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.warn('Gagal mengambil detail dari Supabase:', error.message)
      return {
        data: null,
        isUsingFallback: false,
        error: error.message,
      }
    }

    if (!data) {
      return {
        data: null,
        isUsingFallback: false,
        error: null,
      }
    }

    return {
      data,
      isUsingFallback: false,
      error: null,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return {
      data: null,
      isUsingFallback: false,
      error: errorMsg,
    }
  }
}

/**
 * Mengambil URL gambar tempat dari kolom image_url atau fallback dari JSON opening_hours
 */
export function getPlaceImageUrl(place?: { image_url?: string | null; opening_hours?: any } | null): string | null {
  if (!place) return null
  if (place.image_url && typeof place.image_url === 'string' && place.image_url.trim()) {
    return place.image_url.trim()
  }
  if (place.opening_hours && typeof place.opening_hours === 'object') {
    const hours = place.opening_hours as Record<string, any>
    if (hours.image_url && typeof hours.image_url === 'string' && hours.image_url.trim()) {
      return hours.image_url.trim()
    }
  }
  return null
}

/**
 * Mengajukan / menambahkan tempat baru ke database Supabase
 */
export async function createPlace(placeData: PlaceInsert): Promise<{
  data: Place | null
  error: string | null
}> {
  try {
    // Amankan penyimpanan gambar: simpan juga di dalam JSON opening_hours
    // agar foto tetap tersimpan meskipun database Supabase belum memiliki kolom image_url terpisah
    const rawImage = placeData.image_url && typeof placeData.image_url === 'string' ? placeData.image_url.trim() : null
    const existingHours = typeof placeData.opening_hours === 'object' && placeData.opening_hours !== null
      ? placeData.opening_hours
      : {}
    const openingHoursWithImage = rawImage
      ? { ...existingHours, image_url: rawImage }
      : existingHours

    const payloadWithBackup = {
      ...placeData,
      image_url: rawImage,
      opening_hours: openingHoursWithImage,
    }

    let { data, error } = await supabase
      .from('places')
      .insert(payloadWithBackup as any)
      .select()
      .single()

    // Jika kolom image_url belum dibuat di Supabase, coba simpan ulang tanpa kolom image_url level atas
    // (Foto tetap aman tersimpan di dalam opening_hours.image_url)
    if (error && error.message.toLowerCase().includes('image_url')) {
      console.warn('Kolom image_url belum ada di Supabase, menyimpan foto di dalam opening_hours JSONB...')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { image_url, ...restData } = payloadWithBackup as any
      const retry = await supabase
        .from('places')
        .insert(restData)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Gagal menambahkan tempat ke Supabase:', error.message)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return { data: null, error: errorMsg }
  }
}

/**
 * Mengambil daftar tempat yang diajukan oleh pengguna tertentu (semua status: pending, approved, rejected, needs_revision)
 */
export async function getMyPlaces(userId: string): Promise<{
  data: Place[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*, profiles:created_by(id, display_name, contributor_status)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Gagal memuat tempat pengguna dari Supabase:', error.message)
      return { data: [], error: error.message }
    }

    return { data: (data as Place[]) || [], error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return { data: [], error: errorMsg }
  }
}

// Penyimpanan ulasan lokal jika koneksi Supabase offline
const DUMMY_REVIEWS: Record<string, PlaceReview[]> = {}

/**
 * Mengambil ulasan pengunjung untuk suatu tempat
 */
export async function getPlaceReviews(placeId: string): Promise<{
  data: PlaceReview[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
      .select('*, profiles:user_id(id, display_name)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      const fallback = DUMMY_REVIEWS[placeId] || []
      return { data: fallback, error: null }
    }

    return { data: data as PlaceReview[], error: null }
  } catch {
    const fallback = DUMMY_REVIEWS[placeId] || []
    return { data: fallback, error: null }
  }
}

/**
 * Mengirim ulasan baru untuk tempat
 */
export async function createPlaceReview(reviewData: {
  place_id: string
  user_id: string
  wifi_rating: number
  outlet_rating?: number
  noise_rating?: number
  comment?: string
}): Promise<{
  data: PlaceReview | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
      .upsert(reviewData as any, { onConflict: 'place_id,user_id' })
      .select('*, profiles:user_id(id, display_name)')
      .single()

    if (error) {
      console.warn('Gagal menyimpan ulasan ke Supabase:', error.message)
      const newReview: PlaceReview = {
        id: `local-rev-${Date.now()}`,
        place_id: reviewData.place_id,
        user_id: reviewData.user_id,
        wifi_rating: reviewData.wifi_rating,
        outlet_rating: reviewData.outlet_rating ?? 5,
        noise_rating: reviewData.noise_rating ?? 5,
        comment: reviewData.comment ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: { display_name: 'Anda' },
      }
      if (!DUMMY_REVIEWS[reviewData.place_id]) {
        DUMMY_REVIEWS[reviewData.place_id] = []
      }
      DUMMY_REVIEWS[reviewData.place_id].unshift(newReview)
      return { data: newReview, error: null }
    }

    return { data: data as PlaceReview, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return { data: null, error: msg }
  }
}

/**
 * Mengirim laporan masalah suatu tempat dari pengunjung ke database Supabase
 */
export async function submitReport(reportData: {
  placeId: string
  reason: ReportReason
  description?: string
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const reporterId = session?.user?.id || null

    if (!reporterId) {
      return {
        success: false,
        error: 'Akses ditolak: Kamu perlu masuk ke akun terlebih dahulu untuk mengirimkan laporan.',
      }
    }

    const { error } = await (supabase
      .from('reports') as any)
      .insert({
        place_id: reportData.placeId,
        reporter_id: reporterId,
        reason: reportData.reason,
        description: reportData.description?.trim() || null,
        status: 'open',
      })

    if (error) {
      console.warn('Gagal menyimpan laporan ke Supabase:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return { success: false, error: errorMsg }
  }
}
