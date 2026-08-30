import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria, Producto } from '../types/database'

export default function GestionProductos() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  // Campos del formulario para un nuevo producto
  const [nombre, setNombre] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [precio, setPrecio] = useState('')
  const [costo, setCosto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      // 1. Cargar Categorías
      const { data: catData } = await supabase.from('categorias').select('*').order('nombre')
      if (catData) setCategorias(catData)

      // 2. Cargar Productos
      const { data: prodData } = await supabase.from('productos').select('*').order('nombre')
      if (prodData) setProductos(prodData)
    } catch (err) {
      console.error('Error cargando menú:', err)
    } finally {
      setCargando(false)
    }
  }

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoriaId) {
      alert('Por favor selecciona una categoría')
      return
    }

    setGuardando(true)
    try {
      const { error } = await supabase.from('productos').insert([
        {
          nombre,
          categoria_id: categoriaId,
          precio: parseFloat(precio),
          costo: parseFloat(costo) || 0,
          descripcion,
          disponible: true,
        },
      ])

      if (error) throw error

      // Limpiar formulario y recargar
      setNombre('')
      setPrecio('')
      setCosto('')
      setDescripcion('')
      setModalAbierto(false)
      cargarDatos()
    } catch (err: any) {
      alert('Error al guardar el producto: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const toggleDisponibilidad = async (id: string, estadoActual: boolean) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ disponible: !estadoActual })
        .eq('id', id)

      if (error) throw error
      cargarDatos()
    } catch (err: any) {
      alert('Error cambiando estado: ' + err.message)
    }
  }

  if (cargando) {
    return <p className="text-gray-400 text-center py-8">Cargando menú de Mordiscos...</p>
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con Botón de Acción */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Menú de Productos</h2>
          <p className="text-xs text-gray-400">Administra los productos de tu restobar</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-mordiscos-red hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-lg"
        >
          + Agregar Producto
        </button>
      </div>

      {/* Lista de Productos Agrupados por Categoría */}
      <div className="space-y-6">
        {categorias.map((cat) => {
          const prodsDeCat = productos.filter((p) => p.categoria_id === cat.id)

          return (
            <div key={cat.id} className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
              <h3 className="text-lg font-bold text-mordiscos-orange mb-3 border-b border-gray-800 pb-2">
                {cat.nombre} ({prodsDeCat.length})
              </h3>

              {prodsDeCat.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No hay productos en esta categoría.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {prodsDeCat.map((prod) => (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-lg border flex justify-between items-start transition-colors ${
                        prod.disponible
                          ? 'bg-gray-900 border-gray-800'
                          : 'bg-red-950/20 border-red-900/40 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{prod.nombre}</p>
                        {prod.descripcion && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{prod.descripcion}</p>
                        )}
                        <p className="text-mordiscos-accent font-extrabold text-sm mt-2">
                          Bs {prod.precio.toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleDisponibilidad(prod.id, prod.disponible)}
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          prod.disponible
                            ? 'bg-green-900/40 text-green-400 border border-green-800'
                            : 'bg-red-900/40 text-red-400 border border-red-800'
                        }`}
                      >
                        {prod.disponible ? 'Disponible' : 'Agotado'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal para Agregar Nuevo Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-mordiscos-card p-6 rounded-xl border border-gray-800 max-w-md w-full">
            <h3 className="text-lg font-bold text-mordiscos-orange mb-4">Agregar Nuevo Producto</h3>

            <form onSubmit={handleCrearProducto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
                <select
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm"
                >
                  <option value="">Selecciona una categoría...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 15 Alitas + Papas"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Precio Venta (Bs)</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    placeholder="50.00"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Costo Estimado (Bs)</label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="30.00"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Descripción / Detalles</label>
                <textarea
                  placeholder="Incluye papas y 1 salsa a elección..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 bg-mordiscos-orange hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm shadow"
                >
                  {guardando ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}