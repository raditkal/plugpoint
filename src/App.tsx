import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PlaceDetailPage from './pages/PlaceDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AddPlacePage from './pages/AddPlacePage'
import AdminPage from './pages/AdminPage'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#382E2B] font-sans selection:bg-[#F4CDBE] selection:text-[#382E2B]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {children}
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
          © {new Date().getFullYear()} Plugpoint. Dibuat dengan cinta untuk para pemburu colokan.
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman dengan Navbar & Footer */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/places/:id"
          element={
            <Layout>
              <PlaceDetailPage />
            </Layout>
          }
        />
        <Route
          path="/add-place"
          element={
            <Layout>
              <AddPlacePage />
            </Layout>
          }
        />
        <Route
          path="/admin"
          element={
            <Layout>
              <AdminPage />
            </Layout>
          }
        />

        {/* Halaman Autentikasi Mandiri */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Fallback rute yang tidak dikenal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
