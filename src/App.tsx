import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import type { Place } from './types/place'

function App() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [activeNotice, setActiveNotice] = useState<string | null>(null)

  const handleAddPlaceClick = () => {
    setActiveNotice('Fitur Pengajuan Tempat Baru akan kita buat pada Tahap Autentikasi & Kontribusi!')
  }

  const handleLoginClick = () => {
    setActiveNotice('Halaman Autentikasi & Login Supabase akan kita sambungkan di langkah berikutnya!')
  }

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place)
  }

  const closeNotice = () => {
    setActiveNotice(null)
  }

  const closeDetail = () => {
    setSelectedPlace(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#382E2B] font-sans selection:bg-[#F4CDBE] selection:text-[#382E2B]">
      {/* Top Navbar */}
      <Navbar
        onAddPlaceClick={handleAddPlaceClick}
        onLoginClick={handleLoginClick}
      />

      {/* Main Content */}
      <main className="flex-1">
        <HomePage onSelectPlace={handleSelectPlace} />
      </main>

      {/* FOOTER - Cozy Warm Beige */}
      <footer className="border-t border-[#EAE0D2] bg-[#F4EDE3] py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#7A6B63] space-y-2">
        <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-[#2D231E]">
          <span>plugpoint.</span>
          <span className="text-[#C86D51]">☕</span>
        </div>
        <p className="max-w-md mx-auto leading-relaxed">
          Membantu mahasiswa, freelancer, dan pekerja remote menemukan tempat kerja yang tenang, ber-Wi-Fi kencang, dan bebas rebutan colokan.
        </p>
        <p className="text-[11px] text-[#A6978C] pt-2">
          © {new Date().getFullYear()} Plugpoint. Dibuat dengan cinta & kopi hangat.
        </p>
      </footer>

      {/* Modal Notifikasi Ramah */}
      {activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl border border-[#EAE0D2] text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF2EB] text-[#C86D51] flex items-center justify-center text-xl font-bold">
              ☕
            </div>
            <p className="text-sm text-[#4A3B32] font-semibold leading-relaxed">
              {activeNotice}
            </p>
            <button
              type="button"
              onClick={closeNotice}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#382E2B] hover:bg-[#251D1A] rounded-full transition-all active:scale-95 shadow-sm"
            >
              Oke, Mengerti!
            </button>
          </div>
        </div>
      )}

      {/* Quick Place Detail Modal Preview */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D231E]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-[#EAE0D2] space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C86D51] bg-[#FAF2EB] px-3 py-1 rounded-full border border-[#F0D5C3]">
                  {selectedPlace.area}
                </span>
                <h3 className="text-2xl font-black text-[#2D231E] mt-2">
                  {selectedPlace.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="w-8 h-8 rounded-full bg-[#F5ECE1] text-[#7A6B63] hover:text-[#2D231E] flex items-center justify-center transition-colors font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#5C4D45]">
              <div className="flex items-start gap-2">
                <span>📍</span>
                <span className="font-medium text-[#2D231E]">{selectedPlace.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📶</span>
                <span>Rating Wi-Fi: <strong className="text-[#2D231E]">{selectedPlace.wifi_rating ? `${selectedPlace.wifi_rating}/5` : 'Belum dinilai'}</strong> {selectedPlace.wifi_speed_mbps ? `(${selectedPlace.wifi_speed_mbps} Mbps)` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔌</span>
                <span>Ketersediaan Colokan: <strong className="text-[#2D231E] capitalize">{selectedPlace.outlet_level === 'many' ? 'Banyak Colokan' : selectedPlace.outlet_level === 'few' ? 'Terbatas' : 'Belum diketahui'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌿</span>
                <span>Suasana: <strong className="text-[#2D231E] capitalize">{selectedPlace.noise_level === 'quiet' ? 'Sunyi & Tenang' : selectedPlace.noise_level === 'moderate' ? 'Ramai Santai' : selectedPlace.noise_level === 'noisy' ? 'Cukup Ramai' : 'Belum diketahui'}</strong></span>
              </div>

              {selectedPlace.notes && (
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE4D8] italic text-xs text-[#5C4D45] leading-relaxed mt-2">
                  "{selectedPlace.notes}"
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={closeDetail}
              className="w-full py-3 px-4 text-xs font-bold text-[#4A3B32] bg-[#F2ECE3] hover:bg-[#E8DFD3] rounded-full transition-all"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
