<img src="/logo.png" alt="Mordiscos Logo" className="h-10 w-auto object-contain" />
import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface LoginProps {
  onLoginSuccess: () => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      onLoginSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Revisa tus credenciales.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-mordiscos-dark flex items-center justify-center p-4">
      <div className="bg-mordiscos-card p-6 sm:p-8 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-mordiscos-orange flex items-center justify-center gap-2">
            🍗 MORDISCOS
          </h1>
          <p className="text-sm text-gray-400 mt-1">Wings-Restobar POS</p>
          <div className="h-1 w-16 bg-mordiscos-red mx-auto mt-3 rounded-full"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mordiscos.com"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-mordiscos-orange transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-mordiscos-orange transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-mordiscos-red to-mordiscos-orange hover:opacity-90 text-white font-bold py-3 rounded-lg transition-all shadow-lg disabled:opacity-50 mt-2"
          >
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}