<img src="/logo.png" alt="Mordiscos Logo" className="h-10 w-auto object-contain" />
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import GestionProductos from './components/GestionProductos'
import PuntoVenta from './components/PuntoVenta'
import CocinaKDS from './components/CocinaKDS'
import Reportes from './components/Reportes'

interface Perfil {
  nombre: string
  rol: string
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [vistaActual, setVistaActual] = useState<'pos' | 'productos' | 'cocina' | 'reportes'>('pos')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) obtenerPerfil(session.user.id)
      else setCargando(false)
    })

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

  if (!session) {
    return <Login onLoginSuccess={() => {}} />
  }

  return (
    <div className="min-h-screen bg-mordiscos-dark text-white p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-800 pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mordiscos-orange flex items-center gap-2">
            🍗 MORDISCOS
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">Wings-Restobar POS</p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 overflow-x-auto">
          <button
            onClick={() => setVistaActual('pos')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              vistaActual === 'pos'
                ? 'bg-mordiscos-orange text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🛒 Punto de Venta
          </button>
          <button
            onClick={() => setVistaActual('cocina')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              vistaActual === 'cocina'
                ? 'bg-mordiscos-orange text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🍳 Cocina (KDS)
          </button>
          <button
            onClick={() => setVistaActual('reportes')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              vistaActual === 'reportes'
                ? 'bg-mordiscos-orange text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Reportes
          </button>
          <button
            onClick={() => setVistaActual('productos')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              vistaActual === 'productos'
                ? 'bg-mordiscos-orange text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Productos
          </button>
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

      <main className="max-w-7xl mx-auto">
        {vistaActual === 'pos' && <PuntoVenta />}
        {vistaActual === 'cocina' && <CocinaKDS />}
        {vistaActual === 'reportes' && <Reportes />}
        {vistaActual === 'productos' && <GestionProductos />}
      </main>
    </div>
  )
}