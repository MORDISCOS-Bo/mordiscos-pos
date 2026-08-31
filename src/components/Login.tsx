import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface LoginProps {
  onLoginSuccess: () => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      onLoginSuccess()
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-mordiscos-dark flex items-center justify-center p-4">
      <div className="bg-mordiscos-card p-8 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md space-y-6">
        {/* LOGO E IDENTIDAD */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Mordiscos Logo" 
            className="h-20 w-auto object-contain drop-shadow-md" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-3xl font-black text-mordiscos-orange tracking-wider">MORDISCOS</h1>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Wings - Restobar</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-xs p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-mordiscos-orange"
              placeholder="admin@mordiscos.com"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-mordiscos-orange"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-mordiscos-red to-mordiscos-orange hover:opacity-90 text-white font-bold py-3 rounded-lg text-sm shadow-lg disabled:opacity-50 transition-all mt-2"
          >
            {cargando ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}