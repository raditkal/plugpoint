import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Coffee } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isLoading, isAdmin } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-[#E8DFD3] flex items-center justify-center text-[#8C6D58] animate-spin">
            <Coffee className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#7A6B63] font-semibold">Memeriksa izin akses...</p>
        </div>
      </div>
    )
  }

  // Jika belum login sama sekali, arahkan ke /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Jika membutuhkan akses admin tetapi pengguna bukan admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-[#EFE7DE] shadow-sm space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FDE8E8] text-[#C86D51] flex items-center justify-center font-bold text-xl">
            🔒
          </div>
          <h2 className="text-lg font-black text-[#2D231E]">Akses Khusus Admin</h2>
          <p className="text-xs text-[#7A6B63] leading-relaxed">
            Halaman ini hanya dapat diakses oleh akun moderator/admin Plugpoint.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
