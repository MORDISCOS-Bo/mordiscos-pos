import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria, Producto } from '../types/database'

export default function Productos() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    const { data: catData } = await supabase.from('categorias').select('*').order('nombre')
    if (catData) setCategorias(catData)

    const { data: prodData } = await supabase.from('productos').select('*').order('nombre')
    if (prodData) setProductos(prodData)
    setCargando(false)
  }

  const toggleDisponible = async (prod: Producto) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ disponible: !prod.disponible })
        .eq('id', prod.id)

      if (error) throw error
      cargarDatos()
    } catch (err: any) {
      alert('Error cambiando disponibilidad: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📋 Gestión de Catálogo de Productos
          </h2>
          <p className="text-xs text-gray-400">Activa o desactiva la disponibilidad de tus productos</p>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-400 font-bold">Cargando productos...</div>
      ) : (
        <div className="space-y-6">
          {categorias.map((cat) => {
            const prodsCat = productos.filter((p) => p.categoria_id === cat.id)
            if (prodsCat.length === 0) return null

            return (
              <div key={cat.id} className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 space-y-3">
                <h3 className="text-sm font-bold text-mordiscos-orange uppercase tracking-wider border-b border-gray-800 pb-2">
                  {cat.nombre}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {prodsCat.map((p) => (
                    <div
                      key={p.id}
                      className="bg-gray-900/80 p-3 rounded-lg border border-gray-800/80 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-white text-xs">{p.nombre}</p>
                        <p className="text-mordiscos-accent font-extrabold text-xs">Bs {p.precio.toFixed(2)}</p>
                      </div>

                      <button
                        onClick={() => toggleDisponible(p)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          p.disponible
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                        }`}
                      >
                        {p.disponible ? 'Disponible' : 'Agotado'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}