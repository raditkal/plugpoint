import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Wifi,
  Zap,
  Volume2,
  RefreshCw,
  Flag,
  FileCheck2,
  Loader2,
  ExternalLink,
  Calendar,
  Trash2,
  Store,
  Search,
  Heart,
  X,
  CheckCircle2,
  Pencil
} from 'lucide-react'
import {
  getAdminPlaces,
  moderatePlace,
  deletePlace,
  adminUpdatePlace,
  getAdminReports,
  resolveReport,
  reopenReport,
  getReportResolution,
  getCleanReportDescription,
  type ExtendedReport
} from '../services/admin'
import {
  getShortId,
  formatAddedDate,
  formatFullDate,
  getPlaces,
  findSimilarPlace,
  INDRALAYA_AREAS,
  getPlaceImageUrl,
  type SimilarPlaceMatch
} from '../services/places'
import type { Place, PlaceInsert, OutletLevel, NoiseLevel } from '../types/place'

type AdminTab = 'submissions' | 'reports' | 'approved'

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('submissions')

  // Tempat Masuk (Pengajuan)
  const [allPlaces, setAllPlaces] = useState<Place[]>([])
  const [submissionFilter, setSubmissionFilter] = useState<'pending' | 'rejected' | 'all'>('pending')
  const [isPlacesLoading, setIsPlacesLoading] = useState(true)

  // Tempat yang Sudah Diterima
  const [approvedPlaces, setApprovedPlaces] = useState<Place[]>([])
  const [approvedSearchQuery, setApprovedSearchQuery] = useState('')

  // Laporan Masalah (Filter: 'pending' = Belum Dikonfirmasi, 'reviewed' = Selesai Ditinjau)
  const [allReports, setAllReports] = useState<ExtendedReport[]>([])
  const [reportFilter, setReportFilter] = useState<'pending' | 'reviewed'>('pending')
  const [isReportsLoading, setIsReportsLoading] = useState(true)

  // Modal Moderasi (Tolak Pengajuan)
  const [selectedPlaceForAction, setSelectedPlaceForAction] = useState<{
    place: Place
    action: 'rejected'
  } | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)

  // Modal Peringatan Duplikat saat Approval
  const [duplicateApprovalWarning, setDuplicateApprovalWarning] = useState<{
    place: Place
    match: SimilarPlaceMatch
  } | null>(null)

  // Modal Opsi Tindakan saat Setujui Laporan (Edit Tempat vs Hapus Tempat vs Selesaikan)
  const [reportActionModal, setReportActionModal] = useState<{
    report: ExtendedReport
    place: Place | null
  } | null>(null)

  // Modal Edit Tempat (bisa dibuka dari Laporan atau dari Tab Tempat Diterima)
  const [editingPlace, setEditingPlace] = useState<{
    place: Place
    fromReportId?: string
    reportDescription?: string | null
  } | null>(null)

  const [editForm, setEditForm] = useState<{
    name: string
    area: string
    address: string
    image_url: string
    wifi_speed_mbps: number | ''
    outlet_level: OutletLevel
    noise_level: NoiseLevel
    open_time: string
    close_time: string
    notes: string
  }>({
    name: '',
    area: INDRALAYA_AREAS[0],
    address: '',
    image_url: '',
    wifi_speed_mbps: '',
    outlet_level: 'many',
    noise_level: 'quiet',
    open_time: '08:00',
    close_time: '22:00',
    notes: '',
  })
  const [isEditingSaving, setIsEditingSaving] = useState(false)

  // Modal Konfirmasi Hapus Tempat (bisa dari Laporan atau Tab Tempat Diterima)
  const [placeToDelete, setPlaceToDelete] = useState<{
    place: Place
    fromReportId?: string
    reportDescription?: string | null
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch Semua Data Tempat
  const fetchPlaces = async () => {
    setIsPlacesLoading(true)
    const [resAdmin, resApproved] = await Promise.all([
      getAdminPlaces('all'),
      getPlaces()
    ])
    setAllPlaces(resAdmin.data)
    setApprovedPlaces(resApproved.data)
    setIsPlacesLoading(false)
  }

  // Fetch Laporan (memuat semua laporan agar filter dan hitungan badge akurat)
  const fetchReports = async () => {
    setIsReportsLoading(true)
    const res = await getAdminReports('all')
    setAllReports(res.data)
    setIsReportsLoading(false)
  }

  // Load awal
  useEffect(() => {
    fetchPlaces()
    fetchReports()
  }, [])

  // Handler Moderasi (Approve) dengan Cek Duplikat
  const handleApproveClick = (place: Place) => {
    const match = findSimilarPlace(place.name, approvedPlaces, place.id)
    if (match.isSimilar) {
      setDuplicateApprovalWarning({ place, match })
    } else {
      executeApprove(place)
    }
  }

  const executeApprove = async (place: Place) => {
    setIsPlacesLoading(true)
    await moderatePlace(place.id, 'approved')
    setDuplicateApprovalWarning(null)
    await fetchPlaces()
  }

  // Handler Submit Penolakan Pengajuan Tempat
  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlaceForAction) return

    setIsActionSubmitting(true)
    await moderatePlace(
      selectedPlaceForAction.place.id,
      selectedPlaceForAction.action,
      actionReason.trim()
    )
    setIsActionSubmitting(false)
    setSelectedPlaceForAction(null)
    setActionReason('')
    await fetchPlaces()
  }

  // Buka Modal Edit Tempat
  const openEditModal = (
    place: Place,
    fromReport?: { reportId: string; description?: string | null }
  ) => {
    const hours = place.opening_hours as { daily?: { open?: string; close?: string } } | null
    setEditForm({
      name: place.name || '',
      area: place.area || INDRALAYA_AREAS[0],
      address: place.address || '',
      image_url: getPlaceImageUrl(place) || '',
      wifi_speed_mbps: place.wifi_speed_mbps ?? '',
      outlet_level: (place.outlet_level as OutletLevel) || 'few',
      noise_level: (place.noise_level as NoiseLevel) || 'quiet',
      open_time: hours?.daily?.open || '08:00',
      close_time: hours?.daily?.close || '22:00',
      notes: place.notes || '',
    })
    setEditingPlace({
      place,
      fromReportId: fromReport?.reportId,
      reportDescription: fromReport?.description,
    })
  }

  // Simpan Perubahan Edit Tempat
  const handleSaveEditPlace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlace) return

    setIsEditingSaving(true)

    const rawImg = editForm.image_url.trim() || null
    const updatedData: Partial<PlaceInsert> = {
      name: editForm.name.trim(),
      area: editForm.area,
      address: editForm.address.trim(),
      image_url: rawImg,
      wifi_speed_mbps: editForm.wifi_speed_mbps === '' ? null : Number(editForm.wifi_speed_mbps),
      outlet_level: editForm.outlet_level,
      noise_level: editForm.noise_level,
      notes: editForm.notes.trim() || null,
      opening_hours: {
        daily: {
          open: editForm.open_time,
          close: editForm.close_time,
        },
        ...(rawImg ? { image_url: rawImg } : {}),
      },
    }

    const res = await adminUpdatePlace(editingPlace.place.id, updatedData)

    if (res.success) {
      if (editingPlace.fromReportId) {
        await resolveReport(
          editingPlace.fromReportId,
          'accepted',
          `${editingPlace.reportDescription || ''} (Data tempat telah diperbarui oleh admin)`,
          {
            id: editingPlace.place.id,
            name: editForm.name.trim(),
            area: editForm.area,
          }
        )
      }
      setEditingPlace(null)
      setReportActionModal(null)
      await Promise.all([fetchPlaces(), fetchReports()])
    } else {
      alert('Gagal memperbarui tempat: ' + res.error)
    }
    setIsEditingSaving(false)
  }

  // Handler Hapus Tempat Permanen
  const handleConfirmDelete = async () => {
    if (!placeToDelete) return
    setIsDeleting(true)

    // 1. Jika dihapus karena laporan, simpan status laporan terlebih dahulu dengan data tempat
    if (placeToDelete.fromReportId) {
      await resolveReport(
        placeToDelete.fromReportId,
        'accepted',
        `${placeToDelete.reportDescription || ''} (Tempat telah dihapus dari direktori)`,
        {
          id: placeToDelete.place.id,
          name: placeToDelete.place.name,
          area: placeToDelete.place.area || '',
        }
      )
    }

    // 2. Hapus tempat dari database
    const res = await deletePlace(placeToDelete.place.id)
    setIsDeleting(false)

    if (res.success) {
      setPlaceToDelete(null)
      setReportActionModal(null)
      await Promise.all([fetchPlaces(), fetchReports()])
    } else {
      alert('Gagal menghapus tempat: ' + (res.error || 'Terjadi kesalahan'))
    }
  }

  // Handler Buka Modal Tindakan Terima Laporan
  const handleOpenReportAcceptModal = (report: ExtendedReport) => {
    const targetPlace =
      approvedPlaces.find((p) => p.id === report.place_id) ||
      allPlaces.find((p) => p.id === report.place_id) ||
      (report.places && report.place_id
        ? ({
            id: report.place_id,
            name: report.places.name,
            area: report.places.area,
            address: (report.places as any).address || '',
            status: 'approved',
            outlet_level: 'many',
            noise_level: 'quiet',
            created_at: report.created_at,
            updated_at: report.created_at,
          } as Place)
        : null)

    setReportActionModal({
      report,
      place: targetPlace,
    })
  }

  // Handler Selesaikan Laporan Saja (Tanpa Ubah Tempat)
  const handleDirectResolveReport = async (
    report: ExtendedReport,
    resolution: 'accepted' | 'rejected'
  ) => {
    const targetPlace =
      approvedPlaces.find((p) => p.id === report.place_id) ||
      allPlaces.find((p) => p.id === report.place_id)

    await resolveReport(
      report.id,
      resolution,
      report.description,
      targetPlace
        ? { id: targetPlace.id, name: targetPlace.name, area: targetPlace.area || '' }
        : report.places
    )
    setReportActionModal(null)
    await fetchReports()
  }

  // Handler Buka Kembali Laporan (Reopen)
  const handleReopenReport = async (reportId: string, currentDesc?: string | null) => {
    await reopenReport(reportId, currentDesc)
    await fetchReports()
  }

  // Filter Submissions
  const submissionsList = allPlaces.filter((p) => {
    if (submissionFilter === 'pending') return p.status === 'pending'
    if (submissionFilter === 'rejected') return p.status === 'rejected'
    return p.status !== 'approved'
  })

  // Filter Tempat Diterima (Approved) berdasarkan search
  const filteredApprovedPlaces = approvedPlaces.filter((place) => {
    if (!approvedSearchQuery.trim()) return true
    const q = approvedSearchQuery.toLowerCase()
    return (
      place.name.toLowerCase().includes(q) ||
      (place.area && place.area.toLowerCase().includes(q)) ||
      (place.address && place.address.toLowerCase().includes(q))
    )
  })

  // Filter Laporan Masalah (Belum Dikonfirmasi vs Selesai Ditinjau)
  const pendingReportsCount = allReports.filter(
    (r) => r.status === 'open' || r.status === 'reviewing'
  ).length
  const reviewedReportsCount = allReports.filter((r) => r.status === 'resolved').length

  const displayReports = allReports.filter((r) => {
    if (reportFilter === 'pending') {
      return r.status === 'open' || r.status === 'reviewing'
    }
    return r.status === 'resolved'
  })

  const pendingSubmissionsCount = allPlaces.filter((p) => p.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-6 sm:py-10 px-3 sm:px-6 lg:px-8 text-[#382E2B]">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Navigasi Balik */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Direktori
        </Link>

        {/* Header Panel Moderasi Admin */}
        <div className="bg-white rounded-3xl p-4 sm:p-7 border border-[#EFE7DE] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-[#2D231E]">Panel Admin</h1>
                <span className="text-[10px] sm:text-xs bg-[#FAF2EB] text-[#C86D51] px-2.5 py-0.5 rounded-full font-bold border border-[#F0D5C3]">
                  Admin Dashboard
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#7A6B63] mt-0.5">
                Pusat kontrol direktori: konfirmasi pengajuan, tindak lanjuti laporan, dan kelola tempat aktif
              </p>
            </div>
          </div>

          {/* Tab Navigasi 3 Bagian Utama */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#F5ECE1] p-1.5 rounded-2xl border border-[#E8DFD3] w-full md:w-auto overflow-x-auto no-scrollbar">
            {/* Bagian 1: Konfirmasi Tempat Masuk */}
            <button
              type="button"
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 md:flex-initial shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'submissions'
                  ? 'bg-white text-[#2D231E] shadow-sm'
                  : 'text-[#7A6B63] hover:text-[#2D231E]'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-[#C86D51]" />
              <span>1. Konfirmasi <span className="hidden xs:inline">Tempat</span></span>
              {pendingSubmissionsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C86D51] text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingSubmissionsCount}
                </span>
              )}
            </button>

            {/* Bagian 2: Manajemen Laporan */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex-1 md:flex-initial shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-white text-[#2D231E] shadow-sm'
                  : 'text-[#7A6B63] hover:text-[#2D231E]'
              }`}
            >
              <Flag className="w-4 h-4 text-[#C86D51]" />
              <span>2. Laporan <span className="hidden xs:inline">Masalah</span></span>
              {pendingReportsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingReportsCount}
                </span>
              )}
            </button>

            {/* Bagian 3: Manajemen Tempat Diterima */}
            <button
              type="button"
              onClick={() => setActiveTab('approved')}
              className={`flex-1 md:flex-initial shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'bg-white text-[#2D231E] shadow-sm'
                  : 'text-[#7A6B63] hover:text-[#2D231E]'
              }`}
            >
              <Store className="w-4 h-4 text-[#C86D51]" />
              <span>3. Tempat <span className="hidden xs:inline">Diterima</span></span>
              {approvedPlaces.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  {approvedPlaces.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BAGIAN 1: KONFIRMASI TEMPAT YANG DITAMBAHKAN USER             */}
        {/* ============================================================ */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {/* Filter Bar Pengajuan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 sm:p-4 rounded-3xl border border-[#EFE7DE] shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#7A6B63] mr-1 shrink-0">Filter:</span>
                {[
                  { key: 'pending', label: 'Menunggu Konfirmasi' },
                  { key: 'rejected', label: 'Ditolak' },
                  { key: 'all', label: 'Semua Pengajuan' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSubmissionFilter(item.key as any)}
                    className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      submissionFilter === item.key
                        ? 'bg-[#382E2B] text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3] border border-[#E8DFD3]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={fetchPlaces}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors cursor-pointer self-end sm:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPlacesLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </button>
            </div>

            {/* List Tempat Pengajuan */}
            {isPlacesLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#C86D51]" />
                <p className="text-xs font-bold text-[#7A6B63]">Memuat pengajuan tempat...</p>
              </div>
            ) : submissionsList.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DE] shadow-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center font-bold text-xl">
                  ✨
                </div>
                <h3 className="text-base font-bold text-[#2D231E]">
                  Tidak ada pengajuan dengan status ini
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  Semua pengajuan tempat baru dari pengunjung telah ditinjau dengan baik!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {submissionsList.map((place) => {
                  const hours = place.opening_hours as {
                    daily?: { open?: string; close?: string }
                  } | null

                  const duplicateMatch =
                    place.status !== 'approved'
                      ? findSimilarPlace(place.name, approvedPlaces, place.id)
                      : null

                  return (
                    <div
                      key={place.id}
                      className="bg-white rounded-3xl p-4 sm:p-6 border border-[#EFE7DE] shadow-xs hover:shadow-sm transition-all space-y-3.5 sm:space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EBE1] pb-3.5 sm:pb-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {getPlaceImageUrl(place) && (
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-[#E8DFD3] shadow-2xs">
                              <img
                                src={getPlaceImageUrl(place)!}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h2 className="text-base sm:text-lg font-black text-[#2D231E] break-words">{place.name}</h2>
                              <span
                                className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${
                                  place.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {place.status === 'pending' ? 'Menunggu Konfirmasi' : 'Ditolak'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7A6B63] mt-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                                <span className="line-clamp-1">
                                  {place.area} • {place.address}
                                </span>
                              </div>
                              <span className="text-[#C5B7AA]">•</span>
                              <div
                                className="flex items-center gap-1 text-[11px] text-[#8C7A70] shrink-0"
                                title={place.created_at ? `Diajukan pada ${formatFullDate(place.created_at)}` : undefined}
                              >
                                <Calendar className="w-3 h-3 text-[#A8988C]" />
                                <span>Diajukan {formatAddedDate(place.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Link
                          to={`/places/${getShortId(place.id)}`}
                          target="_blank"
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[11px] font-bold text-[#5C4A3E] border border-[#DFD3C3] w-full sm:w-fit"
                        >
                          <span>Pratinjau Halaman</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Detail Fasilitas */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Wi-Fi</p>
                            <p className="font-extrabold text-[#2D231E] truncate">
                              {place.wifi_speed_mbps
                                ? `${place.wifi_speed_mbps} Mbps`
                                : `${place.wifi_rating || 0}/5 ★`}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Colokan</p>
                            <p className="font-extrabold text-[#2D231E] capitalize truncate">
                              {place.outlet_level === 'many'
                                ? 'Melimpah'
                                : place.outlet_level === 'few'
                                ? 'Terbatas'
                                : 'Belum tahu'}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Suasana</p>
                            <p className="font-extrabold text-[#2D231E] capitalize truncate">
                              {place.noise_level === 'quiet'
                                ? 'Sunyi & Tenang'
                                : place.noise_level === 'moderate'
                                ? 'Ramai Santai'
                                : 'Cukup Ramai'}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Jam Buka</p>
                            <p className="font-extrabold text-[#2D231E] truncate">
                              {hours?.daily?.open && hours?.daily?.close
                                ? `${hours.daily.open} - ${hours.daily.close}`
                                : 'Setiap Hari'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Peringatan Potensi Duplikat untuk Admin */}
                      {duplicateMatch?.isSimilar && duplicateMatch.matchedPlace && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>⚠️ Potensi Duplikat ({duplicateMatch.similarityPercent}% Kesamaan)</span>
                            </span>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                              {duplicateMatch.matchedWords.length} Kata Sama
                            </span>
                          </div>
                          <p className="text-[#5C4524] leading-relaxed">
                            Tempat ini memiliki kemiripan nama dengan tempat yang sudah terbit:{' '}
                            <strong className="text-amber-950 font-bold">
                              "{duplicateMatch.matchedPlace.name}"
                            </strong>
                            {duplicateMatch.matchedPlace.area ? ` di ${duplicateMatch.matchedPlace.area}` : ''}.
                          </p>
                        </div>
                      )}

                      {/* Catatan Tempat / Alasan Penolakan */}
                      {place.notes && (
                        <p className="text-xs text-[#5C4D45] bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2ECE3] italic">
                          "{place.notes}"
                        </p>
                      )}

                      {place.rejection_reason && (
                        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                          <strong>Catatan Penolakan:</strong> {place.rejection_reason}
                        </div>
                      )}

                      {/* Action Buttons Moderasi */}
                      <div className="flex flex-col xs:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-[#F4EBE1]">
                        {place.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApproveClick(place)}
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-full text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer w-full sm:w-auto ${
                              duplicateMatch?.isSimilar
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {duplicateMatch?.isSimilar ? (
                              <>
                                <AlertTriangle className="w-4 h-4" />
                                <span>Tinjau & Setujui</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Setujui (Terbitkan)</span>
                              </>
                            )}
                          </button>
                        )}

                        {place.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPlaceForAction({
                                place,
                                action: 'rejected',
                              })
                            }
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer w-full sm:w-auto"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Tolak Pengajuan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* BAGIAN 2: MANAJEMEN LAPORAN MASALAH DARI KOMUNITAS          */}
        {/* ============================================================ */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Bar Laporan: 2 PILIHAN (Belum Dikonfirmasi & Selesai Ditinjau) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 sm:p-4 rounded-3xl border border-[#EFE7DE] shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-[#7A6B63] mr-1 shrink-0">Status:</span>
                
                {/* 1. Belum Dikonfirmasi */}
                <button
                  type="button"
                  onClick={() => setReportFilter('pending')}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    reportFilter === 'pending'
                      ? 'bg-[#382E2B] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3] border border-[#E8DFD3]'
                  }`}
                >
                  <span>Belum Dikonfirmasi</span>
                  {pendingReportsCount > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        reportFilter === 'pending'
                          ? 'bg-rose-500 text-white'
                          : 'bg-[#FAF2EB] text-[#C86D51]'
                      }`}
                    >
                      {pendingReportsCount}
                    </span>
                  )}
                </button>

                {/* 2. Selesai Ditinjau */}
                <button
                  type="button"
                  onClick={() => setReportFilter('reviewed')}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    reportFilter === 'reviewed'
                      ? 'bg-[#382E2B] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3] border border-[#E8DFD3]'
                  }`}
                >
                  <span>Selesai Ditinjau</span>
                  {reviewedReportsCount > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        reportFilter === 'reviewed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {reviewedReportsCount}
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={fetchReports}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors cursor-pointer self-end sm:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReportsLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {/* List Laporan */}
            {isReportsLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#C86D51]" />
                <p className="text-xs font-bold text-[#7A6B63]">Memuat laporan masalah...</p>
              </div>
            ) : displayReports.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#EFE7DE] shadow-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                  ✨
                </div>
                <h3 className="text-base font-bold text-[#2D231E]">
                  {reportFilter === 'pending'
                    ? 'Tidak ada laporan yang belum dikonfirmasi'
                    : 'Belum ada laporan yang selesai ditinjau'}
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  {reportFilter === 'pending'
                    ? 'Semua laporan masalah dari pengunjung telah ditinjau dan ditindaklanjuti dengan baik!'
                    : 'Laporan yang telah Anda terima atau tolak akan masuk dan tercatat di tab ini.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayReports.map((report) => {
                  const resolution = getReportResolution(report)
                  const cleanDesc = getCleanReportDescription(report.description)
                  const placeDetails =
                    report.places ||
                    allPlaces.find((p) => p.id === report.place_id) ||
                    approvedPlaces.find((p) => p.id === report.place_id)
                  const placeName = placeDetails?.name || 'Tempat Tidak Diketahui'
                  const placeArea = placeDetails?.area || ''

                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-3xl p-4 sm:p-6 border border-[#EFE7DE] shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4EBE1] pb-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF2EB] text-[#C86D51] border border-[#F0D5C3]">
                            {report.reason === 'inaccurate_wifi'
                              ? '📶 Wi-Fi Tidak Akurat'
                              : report.reason === 'inaccurate_outlets'
                              ? '🔌 Colokan Tidak Akurat'
                              : report.reason === 'wrong_location'
                              ? '📍 Lokasi Salah'
                              : report.reason === 'permanently_closed'
                              ? '🔒 Tempat Tutup Permanen'
                              : report.reason === 'duplicate_place'
                              ? '👥 Tempat Duplikat'
                              : report.reason === 'inappropriate_content'
                              ? '🚫 Konten Tidak Pantas'
                              : '⚠️ Laporan Komunitas'}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-[#2D231E] mt-1.5 break-words">
                            {placeName}
                            {placeArea && (
                              <span className="text-xs font-normal text-[#7A6B63] ml-2">
                                ({placeArea})
                              </span>
                            )}
                          </h3>
                        </div>

                        {/* Status Resolution Badge */}
                        <div className="self-start sm:self-auto shrink-0">
                          {resolution === 'open' && (
                            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              ⏳ Belum Dikonfirmasi
                            </span>
                          )}
                          {resolution === 'accepted' && (
                            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ Laporan Diterima
                            </span>
                          )}
                          {resolution === 'rejected' && (
                            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              ✕ Laporan Ditolak
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deskripsi Laporan dari User */}
                      <p className="text-xs text-[#5C4D45] bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2ECE3] leading-relaxed">
                        {cleanDesc || 'Tidak ada catatan tambahan dari pelapor.'}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#A6978C]">
                          <span>
                            Dilaporkan: {new Date(report.created_at).toLocaleDateString('id-ID')}
                          </span>
                          {report.resolved_at && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-800 font-semibold">
                                Ditinjau: {new Date(report.resolved_at).toLocaleDateString('id-ID')}
                              </span>
                            </>
                          )}
                          {report.place_id && (
                            <>
                              <span>•</span>
                              <Link
                                to={`/places/${getShortId(report.place_id)}`}
                                target="_blank"
                                className="text-[#C86D51] font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>Lihat Tempat</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </>
                          )}
                        </div>

                        {/* Action Buttons: Terima Laporan vs Tolak Laporan */}
                        <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                          {resolution === 'open' ? (
                            <>
                              {/* Tombol Terima Laporan (Membuka Pilihan: Edit Tempat vs Hapus Tempat) */}
                              <button
                                type="button"
                                onClick={() => handleOpenReportAcceptModal(report)}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
                                title="Setujui laporan dan pilih tindak lanjut (Edit atau Hapus tempat)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Terima Laporan...</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDirectResolveReport(report, 'rejected')}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer w-full sm:w-auto"
                                title="Tolak laporan jika informasi tidak valid"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Tolak Laporan</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReopenReport(report.id, report.description)}
                              className="px-4 py-2 sm:py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[#7A6B63] hover:text-[#2D231E] font-bold text-xs sm:text-[11px] border border-[#DFD3C3] transition-colors cursor-pointer w-full sm:w-auto text-center"
                            >
                              Tinjau Ulang (Buka Kembali)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* BAGIAN 3: MANAJEMEN TEMPAT YANG SUDAH DITERIMA (BISA HAPUS)  */}
        {/* ============================================================ */}
        {activeTab === 'approved' && (
          <div className="space-y-4">
            {/* Search & Action Bar Tempat Diterima */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border border-[#EFE7DE] shadow-xs">
              <div className="relative flex-1 max-w-md flex items-center bg-[#FAF7F2] border border-[#E4D8C8] rounded-full px-3 py-1.5 focus-within:border-[#C86D51]">
                <Search className="w-4 h-4 text-[#8C6D58] shrink-0 mr-2" />
                <input
                  type="text"
                  value={approvedSearchQuery}
                  onChange={(e) => setApprovedSearchQuery(e.target.value)}
                  placeholder="Cari nama tempat, area, atau alamat..."
                  className="w-full bg-transparent text-xs text-[#2D231E] placeholder:text-[#A8988C] focus:outline-none"
                />
                {approvedSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setApprovedSearchQuery('')}
                    className="p-1 text-[#8C6D58] hover:text-[#2D231E] rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-[11px] font-bold text-[#8C6D58] bg-[#FAF2EB] px-3 py-1.5 rounded-full border border-[#F0D5C3]">
                  {filteredApprovedPlaces.length} tempat aktif
                </span>

                <button
                  type="button"
                  onClick={fetchPlaces}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPlacesLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Segarkan</span>
                </button>
              </div>
            </div>

            {/* List Tempat Aktif */}
            {isPlacesLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#C86D51]" />
                <p className="text-xs font-bold text-[#7A6B63]">Memuat tempat aktif...</p>
              </div>
            ) : filteredApprovedPlaces.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DE] shadow-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center font-bold text-xl">
                  🏪
                </div>
                <h3 className="text-base font-bold text-[#2D231E]">
                  {approvedSearchQuery
                    ? 'Tidak ada tempat yang cocok dengan pencarian'
                    : 'Belum ada tempat yang disetujui'}
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  {approvedSearchQuery
                    ? 'Coba gunakan kata kunci pencarian nama atau area lain.'
                    : 'Pengajuan yang disetujui dari Tab 1 akan muncul di sini.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredApprovedPlaces.map((place) => {
                  return (
                    <div
                      key={place.id}
                      className="bg-white rounded-3xl p-4 sm:p-6 border border-[#EFE7DE] shadow-xs hover:shadow-sm transition-all space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EBE1] pb-3.5">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {getPlaceImageUrl(place) && (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border border-[#E8DFD3] shadow-2xs">
                              <img
                                src={getPlaceImageUrl(place)!}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h2 className="text-base sm:text-lg font-black text-[#2D231E] break-words">{place.name}</h2>
                              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                ✓ Aktif Terbit
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7A6B63] mt-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                                <span className="line-clamp-1">
                                  {place.area} • {place.address}
                                </span>
                              </div>
                              <span className="text-[#C5B7AA]">•</span>
                              <div
                                className="flex items-center gap-1 text-[11px] text-[#8C7A70] shrink-0"
                                title={place.created_at ? `Terbit sejak ${formatFullDate(place.created_at)}` : undefined}
                              >
                                <Calendar className="w-3 h-3 text-[#A8988C]" />
                                <span>{formatAddedDate(place.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <Link
                            to={`/places/${getShortId(place.id)}`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[11px] font-bold text-[#5C4A3E] border border-[#DFD3C3] flex-1 sm:flex-initial"
                          >
                            <span>Buka Halaman</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          {/* Tombol Edit Tempat */}
                          <button
                            type="button"
                            onClick={() => openEditModal(place)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-full bg-[#FAF2EB] hover:bg-[#F3E2D3] text-[#A2533B] text-[11px] font-bold border border-[#E9D0BE] transition-colors cursor-pointer flex-1 sm:flex-initial"
                            title="Edit data tempat ini"
                          >
                            <Pencil className="w-3 h-3 text-[#C86D51]" />
                            <span>Edit Tempat</span>
                          </button>

                          {/* Tombol Hapus Tempat */}
                          <button
                            type="button"
                            onClick={() => setPlaceToDelete({ place })}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer flex-1 sm:flex-initial"
                            title="Hapus tempat ini dari direktori"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Hapus Tempat</span>
                          </button>
                        </div>
                      </div>

                      {/* Detail Ringkas */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Wifi className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Wi-Fi</p>
                            <p className="font-extrabold text-[#2D231E]">
                              {place.wifi_speed_mbps
                                ? `${place.wifi_speed_mbps} Mbps`
                                : `${place.wifi_rating || 0}/5 ★`}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Colokan</p>
                            <p className="font-extrabold text-[#2D231E] capitalize">
                              {place.outlet_level === 'many'
                                ? 'Melimpah'
                                : place.outlet_level === 'few'
                                ? 'Terbatas'
                                : 'Belum tahu'}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Suasana</p>
                            <p className="font-extrabold text-[#2D231E] capitalize">
                              {place.noise_level === 'quiet'
                                ? 'Sunyi & Tenang'
                                : place.noise_level === 'moderate'
                                ? 'Ramai Santai'
                                : 'Cukup Ramai'}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Favorit</p>
                            <p className="font-extrabold text-[#2D231E]">
                              {place.favorites_count || 0} Pengguna
                            </p>
                          </div>
                        </div>
                      </div>

                      {place.notes && (
                        <p className="text-xs text-[#5C4D45] bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#F2ECE3]">
                          {place.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL PILIHAN TINDAKAN SAAT SETUJUI LAPORAN                  */}
      {/* (Opsi 1: Edit Tempat, Opsi 2: Hapus Tempat, Opsi 3: Selesai) */}
      {/* ============================================================ */}
      {reportActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-[#EAE0D2] space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-[#F4EBE1] pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm sm:text-base font-black text-[#2D231E]">
                  Setujui Laporan Komunitas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportActionModal(null)}
                className="w-7 h-7 rounded-full bg-[#F5ECE1] text-[#7A6B63] hover:text-[#2D231E] flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Info Laporan & Tempat */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] space-y-1.5 text-xs">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                <span className="font-bold text-[#8C7A70] uppercase text-[10px]">Tempat Terlapor:</span>
                <span className="font-extrabold text-[#2D231E] truncate">
                  {reportActionModal.place?.name || reportActionModal.report.places?.name || 'Tempat'}
                </span>
              </div>
              <p className="text-[#5C4D45] text-[11px] break-words">
                {reportActionModal.place?.area || reportActionModal.report.places?.area || '-'} • {reportActionModal.place?.address || ''}
              </p>
              <div className="pt-2 border-t border-[#E8DFD3] text-[11px] text-[#7A6B63] break-words">
                <strong className="text-[#382E2B]">Catatan Pelapor:</strong> "{getCleanReportDescription(reportActionModal.report.description) || 'Tidak ada catatan tambahan'}"
              </div>
            </div>

            <p className="text-xs text-[#5C4D45] leading-relaxed">
              Anda menyetujui laporan ini. Pilih tindakan yang ingin Anda lakukan terhadap tempat ini:
            </p>

            {/* 2 Opsi Utama Sesuai Permintaan Admin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Opsi 1: Edit Tempat */}
              <button
                type="button"
                onClick={() => {
                  if (reportActionModal.place) {
                    openEditModal(reportActionModal.place, {
                      reportId: reportActionModal.report.id,
                      description: reportActionModal.report.description,
                    })
                  } else {
                    alert('Data tempat tidak ditemukan di memori')
                  }
                }}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-[#E9D0BE] bg-[#FAF4ED] hover:bg-[#F5ECE1] hover:border-[#C86D51] transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs"
              >
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-white text-[#C86D51] flex items-center justify-center font-bold shadow-2xs">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-[#2D231E] group-hover:text-[#C86D51] transition-colors pt-1">
                    1. Edit Data Tempat
                  </h4>
                  <p className="text-[11px] text-[#7A6B63] leading-relaxed">
                    Perbarui nama, alamat, Wi-Fi, colokan, atau jam operasional sesuai laporan.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-[#C86D51] mt-3 inline-flex items-center gap-1">
                  Buka Formulir Edit →
                </span>
              </button>

              {/* Opsi 2: Hapus Tempat */}
              <button
                type="button"
                onClick={() => {
                  if (reportActionModal.place) {
                    setPlaceToDelete({
                      place: reportActionModal.place,
                      fromReportId: reportActionModal.report.id,
                      reportDescription: reportActionModal.report.description,
                    })
                  } else {
                    alert('Data tempat tidak ditemukan di memori')
                  }
                }}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 hover:border-rose-400 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs"
              >
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold shadow-2xs">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-[#2D231E] group-hover:text-rose-700 transition-colors pt-1">
                    2. Hapus Tempat Ini
                  </h4>
                  <p className="text-[11px] text-[#7A6B63] leading-relaxed">
                    Hapus permanen dari direktori jika tempat tutup permanen atau tidak valid.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-rose-700 mt-3 inline-flex items-center gap-1">
                  Konfirmasi Hapus →
                </span>
              </button>
            </div>

            {/* Opsi 3: Hanya Terima Laporan Tanpa Ubah Data Tempat */}
            <div className="pt-3 border-t border-[#F2ECE3] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setReportActionModal(null)}
                className="w-full sm:w-auto py-2 px-3 text-center text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDirectResolveReport(
                    reportActionModal.report,
                    'accepted'
                  )
                }
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#F2ECE3] border border-[#DFD3C3] cursor-pointer text-center"
              >
                ✓ Tandai Diterima Saja (Tanpa Perubahan)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL FORM EDIT DATA TEMPAT                                  */}
      {/* ============================================================ */}
      {editingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-[#EAE0D2] space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F4EBE1] pb-3">
              <div className="flex items-center gap-2 text-[#C86D51]">
                <Pencil className="w-5 h-5 shrink-0" />
                <h3 className="text-sm sm:text-base font-black text-[#2D231E]">
                  Edit Informasi Tempat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlace(null)}
                className="w-7 h-7 rounded-full bg-[#F5ECE1] text-[#7A6B63] hover:text-[#2D231E] flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {editingPlace.fromReportId && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                ℹ️ Tempat ini sedang diedit berdasarkan laporan komunitas. Setelah disimpan, laporan ini akan otomatis ditandai <strong>Selesai (Diterima)</strong>.
              </div>
            )}

            <form onSubmit={handleSaveEditPlace} className="space-y-3.5 text-xs">
              {/* Nama Tempat */}
              <div className="space-y-1">
                <label className="font-bold text-[#4A3B32]">Nama Tempat *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                />
              </div>

              {/* Area Indralaya */}
              <div className="space-y-1">
                <label className="font-bold text-[#4A3B32]">Area (Indralaya) *</label>
                <select
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                >
                  {INDRALAYA_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1">
                <label className="font-bold text-[#4A3B32]">Alamat Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                />
              </div>

              {/* Foto / Gambar Tempat */}
              <div className="space-y-1">
                <label className="font-bold text-[#4A3B32]">Link URL Foto Tempat (Opsional)</label>
                <input
                  type="text"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/... atau Data URL"
                  className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                />
                {editForm.image_url && (
                  <div className="mt-1 h-24 w-full rounded-xl overflow-hidden border border-[#E8DFD3]">
                    <img
                      src={editForm.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              {/* Kecepatan Wi-Fi & Colokan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#4A3B32]">Kecepatan Wi-Fi (Mbps)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="Contoh: 45"
                    value={editForm.wifi_speed_mbps}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        wifi_speed_mbps: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#4A3B32]">Ketersediaan Colokan</label>
                  <select
                    value={editForm.outlet_level}
                    onChange={(e) => setEditForm({ ...editForm, outlet_level: e.target.value as OutletLevel })}
                    className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  >
                    <option value="many">Melimpah (Hampir di setiap meja)</option>
                    <option value="few">Terbatas (Hanya di beberapa titik)</option>
                    <option value="unknown">Belum Tahu</option>
                  </select>
                </div>
              </div>

              {/* Suasana & Jam Buka */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-[#4A3B32]">Suasana</label>
                  <select
                    value={editForm.noise_level}
                    onChange={(e) => setEditForm({ ...editForm, noise_level: e.target.value as NoiseLevel })}
                    className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  >
                    <option value="quiet">Sunyi & Tenang</option>
                    <option value="moderate">Ramai Santai</option>
                    <option value="noisy">Cukup Ramai</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#4A3B32]">Buka Jam</label>
                  <input
                    type="time"
                    value={editForm.open_time}
                    onChange={(e) => setEditForm({ ...editForm, open_time: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#4A3B32]">Tutup Jam</label>
                  <input
                    type="time"
                    value={editForm.close_time}
                    onChange={(e) => setEditForm({ ...editForm, close_time: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                  />
                </div>
              </div>

              {/* Catatan Tempat */}
              <div className="space-y-1">
                <label className="font-bold text-[#4A3B32]">Catatan Tempat (Opsional)</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Catatan suasana nugas, fasilitas stopkontak, parkiran, dsb..."
                  className="w-full p-2.5 rounded-xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setEditingPlace(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold text-[#7A6B63] hover:bg-[#F2ECE3] cursor-pointer text-center"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isEditingSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isEditingSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PENOLAKAN PENGANJUAN TEMPAT                            */}
      {/* ============================================================ */}
      {selectedPlaceForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-[#EAE0D2] space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F4EBE1] pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#2D231E]">
                Tolak Pengajuan Tempat
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPlaceForAction(null)}
                className="w-7 h-7 rounded-full bg-[#F5ECE1] text-[#7A6B63] hover:text-[#2D231E] flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#7A6B63]">
              Berikan alasan penolakan untuk tempat{' '}
              <strong className="text-[#2D231E]">{selectedPlaceForAction.place.name}</strong>:
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <textarea
                required
                rows={4}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Contoh: Tempat ini duplikat dengan tempat yang sudah terdaftar / informasi tidak valid / bukan kafe publik..."
                className="w-full text-xs p-3.5 rounded-2xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
              />

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-1 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setSelectedPlaceForAction(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold text-[#7A6B63] hover:bg-[#F5ECE1] cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isActionSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 bg-rose-600 hover:bg-rose-700 cursor-pointer text-center"
                >
                  {isActionSubmitting ? 'Memproses...' : 'Tolak Tempat Ini'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PERINGATAN APPROVAL TEMPAT POTENSI DUPLIKAT            */}
      {/* ============================================================ */}
      {duplicateApprovalWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-amber-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-amber-600 border-b border-[#F4EBE1] pb-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-black text-[#2D231E]">
                  Peringatan: Potensi Tempat Duplikat
                </h3>
                <p className="text-[11px] text-[#7A6B63]">
                  Periksa kemiripan sebelum menyetujui tempat ini ke direktori publik
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#FAF7F2] p-3.5 sm:p-4 rounded-2xl border border-[#EFE7DE]">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#8C7A70]">Tempat yang akan disetujui:</p>
                <p className="font-extrabold text-[#2D231E] text-sm mt-0.5">{duplicateApprovalWarning.place.name}</p>
                <p className="text-[#5C4D45] text-[11px]">{duplicateApprovalWarning.place.area} • {duplicateApprovalWarning.place.address}</p>
              </div>

              <div className="pt-2 border-t border-[#E8DFD3]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase text-amber-800">
                    Mirip dengan tempat yang sudah terbit:
                  </p>
                  <span className="text-[10px] font-extrabold bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-full shrink-0">
                    {duplicateApprovalWarning.match.similarityPercent}% Mirip
                  </span>
                </div>
                <p className="font-extrabold text-amber-950 text-sm mt-0.5">{duplicateApprovalWarning.match.matchedPlace?.name}</p>
                <p className="text-[#5C4D45] text-[11px]">{duplicateApprovalWarning.match.matchedPlace?.area} • {duplicateApprovalWarning.match.matchedPlace?.address}</p>
                <p className="text-[11px] text-amber-800 mt-1">
                  Kata / ejaan mirip: <strong>{duplicateApprovalWarning.match.matchedWords.join(', ')}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5C4D45] leading-relaxed">
              Apakah tempat ini merupakan cabang berbeda atau tempat yang sama persis? Jika tempat ini duplikat, Anda dapat membatalkan dan menolak pengajuan.
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-[#F2ECE3]">
              <button
                type="button"
                onClick={() => setDuplicateApprovalWarning(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#F2ECE3] transition-colors cursor-pointer text-center"
              >
                Batal & Periksa Dulu
              </button>
              <button
                type="button"
                onClick={() => executeApprove(duplicateApprovalWarning.place)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
              >
                Tetap Setujui (Bukan Duplikat)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL KONFIRMASI HAPUS TEMPAT                                */}
      {/* ============================================================ */}
      {placeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-rose-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-rose-600 border-b border-[#F4EBE1] pb-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-black text-[#2D231E]">
                  Hapus Tempat Secara Permanen?
                </h3>
                <p className="text-[11px] text-[#7A6B63]">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2 text-xs">
              <p className="text-rose-900 font-bold text-sm break-words">
                "{placeToDelete.place.name}"
              </p>
              <p className="text-[#7A6B63] text-[11px] break-words">
                {placeToDelete.place.area} • {placeToDelete.place.address}
              </p>
              <p className="text-rose-800 leading-relaxed pt-1 border-t border-rose-200/80 text-[11px]">
                ⚠️ Tempat ini akan dihapus permanen dari database. Semua riwayat ulasan, rating Wi-Fi, dan daftar favorit pengguna yang menyimpan tempat ini akan ikut terhapus.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-[#F2ECE3]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPlaceToDelete(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#F2ECE3] transition-colors cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 text-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {placeToDelete.fromReportId
                        ? 'Hapus Tempat & Selesaikan Laporan'
                        : 'Ya, Hapus Tempat'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
