import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PlaceDetailPage from './pages/PlaceDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AddPlacePage from './pages/AddPlacePage'
import AdminPage from './pages/AdminPage'
import MyPlacesPage from './pages/MyPlacesPage'

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
          <span>Plugpoint.</span>
        </div>
        <p className="text-[11px] text-[#A6978C] pt-2">
          © {new Date().getFullYear()} Plugpoint. Dibuat dengan jerih payah sendiri (NO AI).
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <FavoritesProvider>
          <Routes>
          {/* Halaman Publik */}
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

          {/* Halaman yang Membutuhkan Login */}
          <Route
            path="/add-place"
            element={
              <ProtectedRoute>
                <Layout>
                  <AddPlacePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-places"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyPlacesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Halaman Khusus Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <AdminPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/favorites"
            element={<Navigate to="/my-places?tab=favorites" replace />}
          />

          {/* Halaman Autentikasi Mandiri */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Fallback rute yang tidak dikenal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FavoritesProvider>
    </BrowserRouter>
  </AuthProvider>
  )
}

export default App
