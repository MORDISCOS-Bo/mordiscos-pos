import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

interface Categoria {
  id: string
  nombre: string
  descripcion: string
}

export default function App() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [errorConexion, setErrorConexion] = useState<string | null>(null)

  useEffect(() => {
    async function cargarCategorias() {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nombre, descripcion')

        if (error) {
          // Imprimimos el error detallado en la consola del navegador
          console.error('Error detallado de Supabase:', error)
          setErrorConexion(error.message || JSON.stringify(error))
          return
        }

        if (data) {
          setCategorias(data)
        }
      } catch (err: any) {
        console.error('Error atrapado:', err)
        setErrorConexion(err?.message || 'Error al intentar conectar con el servidor')
      } finally {
        setCargando(false)
      }
    }

    cargarCategorias()
  }, [])

  return (
    <div className="min-h-screen bg-mordiscos-dark text-white p-4 sm:p-6">
      <header className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mordiscos-orange flex items-center gap-2">
            🍗 MORDISCOS
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">Wings-Restobar POS</p>
        </div>
        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/30">
          Supabase Conectado
        </span>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        <div className="bg-mordiscos-card p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-bold text-mordiscos-accent mb-4">
            Categorías del Sistema (Desde la nube)
          </h2>

          {cargando && <p className="text-gray-400">Cargando datos de Supabase...</p>}

          {errorConexion && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm font-mono break-all">
               Error de conexión: {errorConexion}
            </div>
          )}

          {!cargando && !errorConexion && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-mordiscos-orange/50 transition-colors"
                >
                  <p className="font-semibold text-white">{cat.nombre}</p>
                  <p className="text-xs text-gray-400 mt-1">{cat.descripcion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}