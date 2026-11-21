import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Coffee, Lock, Mail, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const RegisterPage: React.FC = () => {
  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Redirect jika sudah login
  useEffect(() => {
    if (user && !isSuccess) {
      navigate('/', { replace: true })
    }
  }, [user, navigate, isSuccess])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 6) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.')
      return
    }

    setIsLoading(true)
    const res = await signUp(email.trim(), password, displayName.trim())
    setIsLoading(false)

    if (res.error) {
      if (res.error.message.includes('User already registered')) {
        setErrorMsg('Email ini sudah terdaftar. Silakan langsung masuk.')
      } else {
        setErrorMsg(res.error.message)
      }
    } else {
      setIsSuccess(true)
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
          Gabung Plugpoint
        </h2>
        <p className="text-xs text-[#7A6B63]">
          Mulai rekomendasikan tempat kerja dengan Wi-Fi kencang dan banyak colokan
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

          {isSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#2D231E]">Pendaftaran Berhasil! 🎉</h3>
              <p className="text-xs text-[#7A6B63] leading-relaxed">
                Akunmu sudah dibuat. Cek kotak masuk email kamu jika Supabase mengaktifkan konfirmasi email, atau langsung klik tombol di bawah untuk masuk.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block py-2.5 px-6 rounded-full bg-[#382E2B] text-white text-xs font-bold hover:bg-[#251D1A] transition-all"
                >
                  Masuk ke Akun
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">
                  Nama Lengkap / Panggilan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A6978C]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                </div>
              </div>

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
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD3C3] text-xs text-[#382E2B] focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#C86D51] hover:bg-[#B35A3F] text-white text-xs font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <span>Daftar Sekarang</span>
                )}
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-[#7A6B63]">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-bold text-[#C86D51] hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
