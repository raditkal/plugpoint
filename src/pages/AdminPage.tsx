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
  Calendar
} from 'lucide-react'
import {
  getAdminPlaces,
  moderatePlace,
  getAdminReports,
  updateReportStatus,
  type ExtendedReport
} from '../services/admin'
import { getShortId, formatAddedDate, formatFullDate } from '../services/places'
import type { Place, PlaceStatus, ReportStatus } from '../types/place'

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'places' | 'reports'>('places')

  // Tempat
  const [places, setPlaces] = useState<Place[]>([])
  const [placeFilter, setPlaceFilter] = useState<PlaceStatus | 'all'>('pending')
  const [isPlacesLoading, setIsPlacesLoading] = useState(true)

  // Laporan
  const [reports, setReports] = useState<ExtendedReport[]>([])
  const [reportFilter, setReportFilter] = useState<ReportStatus | 'all'>('all')
  const [isReportsLoading, setIsReportsLoading] = useState(true)

  // Modal Moderasi (Tolak / Revisi)
  const [selectedPlaceForAction, setSelectedPlaceForAction] = useState<{
    place: Place
    action: 'rejected' | 'needs_revision'
  } | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)

  // Load Tempat
  const fetchPlaces = async () => {
    setIsPlacesLoading(true)
    const res = await getAdminPlaces(placeFilter)
    setPlaces(res.data)
    setIsPlacesLoading(false)
  }

  // Load Laporan
  const fetchReports = async () => {
    setIsReportsLoading(true)
    const res = await getAdminReports(reportFilter)
    setReports(res.data)
    setIsReportsLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'places') {
      fetchPlaces()
    } else {
      fetchReports()
    }
  }, [activeTab, placeFilter, reportFilter])

  // Handler Moderasi Cepat (Approve)
  const handleApprove = async (place: Place) => {
    setIsPlacesLoading(true)
    await moderatePlace(place.id, 'approved')
    await fetchPlaces()
  }

  // Handler Submit Penolakan / Permintaan Revisi
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

  // Handler Update Status Laporan
  const handleReportStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    await updateReportStatus(reportId, newStatus)
    await fetchReports()
  }

  const pendingCount = places.filter((p) => p.status === 'pending').length
  const openReportsCount = reports.filter((r) => r.status === 'open').length

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-10 px-4 sm:px-6 lg:px-8 text-[#382E2B]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigasi Balik */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Direktori
        </Link>

        {/* Header Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#2D231E]">Panel Moderasi Admin</h1>
                <span className="text-xs bg-[#FAF2EB] text-[#C86D51] px-2.5 py-0.5 rounded-full font-bold border border-[#F0D5C3]">
                  Admin Mode
                </span>
              </div>
              <p className="text-xs text-[#7A6B63] mt-0.5">
                Verifikasi kualitas data tempat dan tangani laporan komunitas Plugpoint
              </p>
            </div>
          </div>

          {/* Tab Navigasi */}
          <div className="flex items-center gap-2 bg-[#F5ECE1] p-1.5 rounded-2xl border border-[#E8DFD3]">
            <button
              type="button"
              onClick={() => setActiveTab('places')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'places'
                  ? 'bg-white text-[#2D231E] shadow-sm'
                  : 'text-[#7A6B63] hover:text-[#2D231E]'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-[#C86D51]" />
              <span>Pengajuan Tempat</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C86D51] text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-white text-[#2D231E] shadow-sm'
                  : 'text-[#7A6B63] hover:text-[#2D231E]'
              }`}
            >
              <Flag className="w-4 h-4 text-[#C86D51]" />
              <span>Laporan Masalah</span>
              {openReportsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {openReportsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: MODERASI TEMPAT */}
        {activeTab === 'places' && (
          <div className="space-y-4">
            {/* Filter Bar Tempat */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE7DE] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7A6B63] mr-1">Status:</span>
                {(['pending', 'needs_revision', 'approved', 'rejected', 'all'] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPlaceFilter(status)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                        placeFilter === status
                          ? 'bg-[#382E2B] text-white shadow-xs'
                          : 'bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3] border border-[#E8DFD3]'
                      }`}
                    >
                      {status === 'pending'
                        ? 'Menunggu (Pending)'
                        : status === 'needs_revision'
                        ? 'Perlu Revisi'
                        : status === 'approved'
                        ? 'Disetujui'
                        : status === 'rejected'
                        ? 'Ditolak'
                        : 'Semua'}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={fetchPlaces}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPlacesLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {/* List Tempat */}
            {isPlacesLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#C86D51]" />
                <p className="text-xs font-bold text-[#7A6B63]">Memuat daftar tempat...</p>
              </div>
            ) : places.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DE] shadow-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center font-bold text-xl">
                  ✨
                </div>
                <h3 className="text-base font-bold text-[#2D231E]">
                  Tidak ada tempat dengan status ini
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  Semua pengajuan telah ditangani atau belum ada data baru.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {places.map((place) => {
                  const hours = place.opening_hours as {
                    daily?: { open?: string; close?: string }
                  } | null

                  return (
                    <div
                      key={place.id}
                      className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs hover:shadow-sm transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EBE1] pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-[#2D231E]">{place.name}</h2>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                place.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : place.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : place.status === 'needs_revision'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {place.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7A6B63] mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#C86D51] shrink-0" />
                              <span>
                                {place.area} • {place.address}
                              </span>
                            </div>
                            <span className="text-[#C5B7AA]">•</span>
                            <div
                              className="flex items-center gap-1 text-[11px] text-[#8C7A70]"
                              title={place.created_at ? `Diajukan pada ${formatFullDate(place.created_at)}` : undefined}
                            >
                              <Calendar className="w-3 h-3 text-[#A8988C]" />
                              <span>Diajukan {formatAddedDate(place.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          to={`/places/${getShortId(place.id)}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[11px] font-bold text-[#5C4A3E] border border-[#DFD3C3] w-fit"
                        >
                          <span>Buka Halaman</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Detail Fasilitas */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">Wi-Fi</p>
                            <p className="font-extrabold text-[#2D231E]">
                              {place.wifi_speed_mbps
                                ? `${place.wifi_speed_mbps} Mbps`
                                : `${place.wifi_rating || 0}/5 ★`}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">
                              Colokan
                            </p>
                            <p className="font-extrabold text-[#2D231E] capitalize">
                              {place.outlet_level === 'many'
                                ? 'Melimpah'
                                : place.outlet_level === 'few'
                                ? 'Terbatas'
                                : 'Belum tahu'}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">
                              Suasana
                            </p>
                            <p className="font-extrabold text-[#2D231E] capitalize">
                              {place.noise_level === 'quiet'
                                ? 'Sunyi & Tenang'
                                : place.noise_level === 'moderate'
                                ? 'Ramai Santai'
                                : 'Cukup Ramai'}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#C86D51] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#A6978C] uppercase font-bold">
                              Jam Buka
                            </p>
                            <p className="font-extrabold text-[#2D231E]">
                              {hours?.daily?.open && hours?.daily?.close
                                ? `${hours.daily.open} - ${hours.daily.close}`
                                : 'Setiap Hari'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Catatan Tempat / Alasan Penolakan */}
                      {place.notes && (
                        <p className="text-xs text-[#5C4D45] bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2ECE3] italic">
                          "{place.notes}"
                        </p>
                      )}

                      {place.rejection_reason && (
                        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                          <strong>Catatan Moderator:</strong> {place.rejection_reason}
                        </div>
                      )}

                      {/* Action Buttons Moderasi */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        {place.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(place)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Setujui (Terbitkan)</span>
                          </button>
                        )}

                        {place.status !== 'needs_revision' && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPlaceForAction({
                                place,
                                action: 'needs_revision',
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Minta Revisi</span>
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
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
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

        {/* TAB 2: LAPORAN MASALAH */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Bar Laporan */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE7DE] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7A6B63] mr-1">Status:</span>
                {(['all', 'open', 'reviewing', 'resolved'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReportFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                      reportFilter === status
                        ? 'bg-[#382E2B] text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-[#7A6B63] hover:bg-[#F2ECE3] border border-[#E8DFD3]'
                    }`}
                  >
                    {status === 'open'
                      ? 'Belum Ditangani (Open)'
                      : status === 'reviewing'
                      ? 'Sedang Ditinjau'
                      : status === 'resolved'
                      ? 'Selesai (Resolved)'
                      : 'Semua'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={fetchReports}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#5C4A3E] hover:bg-[#EFE6DA] transition-colors cursor-pointer"
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
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE7DE] shadow-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                  ✨
                </div>
                <h3 className="text-base font-bold text-[#2D231E]">
                  Tidak ada laporan dengan status ini
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  Semua direktori tempat dalam kondisi akurat dan terverifikasi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4EBE1] pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF2EB] text-[#C86D51] border border-[#F0D5C3]">
                          {report.reason === 'inaccurate_wifi'
                            ? '📶 Wi-Fi Tidak Akurat'
                            : report.reason === 'inaccurate_outlets'
                            ? '🔌 Colokan Tidak Akurat'
                            : report.reason === 'wrong_location'
                            ? '📍 Lokasi Salah'
                            : report.reason === 'permanently_closed'
                            ? '🔒 Tempat Tutup Permanen'
                            : '⚠️ Laporan Komunitas'}
                        </span>
                        <h3 className="text-base font-bold text-[#2D231E] mt-1.5">
                          {report.places?.name || 'Tempat'}
                          <span className="text-xs font-normal text-[#7A6B63] ml-2">
                            ({report.places?.area || '-'})
                          </span>
                        </h3>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full w-fit ${
                          report.status === 'open'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : report.status === 'reviewing'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        Status: {report.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#5C4D45] bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2ECE3]">
                      {report.description || 'Tidak ada catatan tambahan dari pelapor.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <span className="text-[11px] text-[#A6978C]">
                        Dilaporkan: {new Date(report.created_at).toLocaleDateString('id-ID')}
                      </span>

                      <div className="flex items-center gap-2">
                        {report.status !== 'reviewing' && (
                          <button
                            type="button"
                            onClick={() => handleReportStatusChange(report.id, 'reviewing')}
                            className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                          >
                            Tandai Sedang Ditinjau
                          </button>
                        )}

                        {report.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => handleReportStatusChange(report.id, 'resolved')}
                            className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                          >
                            Tandai Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL ALASAN PENOLAKAN / REVISI */}
      {selectedPlaceForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-[#EAE0D2] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#2D231E]">
                {selectedPlaceForAction.action === 'needs_revision'
                  ? 'Minta Perbaikan Informasi'
                  : 'Tolak Pengajuan Tempat'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPlaceForAction(null)}
                className="w-7 h-7 rounded-full bg-[#F5ECE1] text-[#7A6B63] hover:text-[#2D231E] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#7A6B63]">
              Berikan catatan kepada kontributor untuk tempat{' '}
              <strong>{selectedPlaceForAction.place.name}</strong>:
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <textarea
                required
                rows={4}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  selectedPlaceForAction.action === 'needs_revision'
                    ? 'Contoh: Mohon lengkapi alamat detail atau jam buka yang akurat...'
                    : 'Contoh: Lokasi ini adalah rumah pribadi / bukan tempat publik...'
                }
                className="w-full text-xs p-3.5 rounded-2xl border border-[#DFD3C3] bg-[#FAF7F2] text-[#382E2B] focus:outline-none focus:border-[#C86D51]"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlaceForAction(null)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-[#7A6B63] hover:bg-[#F5ECE1]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isActionSubmitting}
                  className={`px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 ${
                    selectedPlaceForAction.action === 'needs_revision'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {isActionSubmitting ? 'Memproses...' : 'Kirim Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
