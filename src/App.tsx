import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'

interface Perfil {
  nombre: string
  rol: string
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // 1. Obtener la sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) obtenerPerfil(session.user.id)
      else setCargando(false)
    })

    // 2. Escuchar cambios de estado (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) obtenerPerfil(session.user.id)
      else {
        setPerfil(null)
        setCargando(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const obtenerPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('nombre, rol')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) setPerfil(data)
    } catch (err) {
      console.error('Error cargando perfil:', err)
    } finally {
      setCargando(false)
    }
  }

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-mordiscos-dark flex items-center justify-center text-white">
        <p className="animate-pulse text-mordiscos-orange font-semibold">Cargando Mordiscos POS...</p>
      </div>
    )
  }

  // Si no hay sesión activa, muestra la pantalla de Login
  if (!session) {
    return <Login onLoginSuccess={() => {}} />
  }

  // Si la sesión está activa, muestra el Dashboard inicial
  return (
    <div className="min-h-screen bg-mordiscos-dark text-white p-4 sm:p-6">
      <header className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mordiscos-orange flex items-center gap-2">
            🍗 MORDISCOS
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">Wings-Restobar POS</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{perfil?.nombre || 'Usuario'}</p>
            <p className="text-xs text-mordiscos-accent uppercase font-mono">{perfil?.rol || 'Rol'}</p>
          </div>
          <button
            onClick={handleCerrarSesion}
            className="bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-mordiscos-card p-6 rounded-xl border border-gray-800 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-2">¡Bienvenido al Sistema!</h2>
          <p className="text-gray-300">
            Has iniciado sesión correctamente como <strong className="text-mordiscos-orange">{perfil?.nombre}</strong> ({perfil?.rol}).
          </p>
        </div>
      </main>
    </div>
  )
}