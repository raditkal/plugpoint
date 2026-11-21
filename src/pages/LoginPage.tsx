import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Coffee, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const LoginPage: React.FC = () => {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Redirect jika sudah dalam status login
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    const res = await signIn(email.trim(), password)
    setIsLoading(false)

    if (res.error) {
      if (res.error.message.includes('Invalid login credentials')) {
        setErrorMsg('Email atau kata sandi yang kamu masukkan salah.')
      } else if (res.error.message.includes('Email not confirmed')) {
        setErrorMsg('Email kamu belum dikonfirmasi. Cek kotak masuk atau spam email ya.')
      } else {
        setErrorMsg(res.error.message)
      }
    } else {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6B63] hover:text-[#2D231E] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4 text-[#C86D51]" />
          Kembali ke Beranda
        </Link>
        <div className="w-14 h-14 mx-auto rounded-3xl bg-[#E8DFD3] border border-[#D9CDBF] flex items-center justify-center text-[#8C6D58] shadow-sm">
          <Coffee className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-black text-[#2D231E] tracking-tight">
          Selamat Datang Kembali
        </h2>
        <p className="text-xs text-[#7A6B63]">
          Masuk untuk merekomendasikan spot kerja favoritmu
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-3xl border border-[#EFE7DE] sm:px-10 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A6978C]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A6978C]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-[#382E2B] hover:bg-[#251D1A] text-white text-xs font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#F4CDBE]" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <span>Masuk ke Akun</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#7A6B63]">
            Belum punya akun?{' '}
            <Link to="/register" className="font-bold text-[#C86D51] hover:underline">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
