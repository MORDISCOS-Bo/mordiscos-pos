import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria, Producto } from '../types/database'

export default function GestionProductos() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  // Estados Formulario (Crear/Editar)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [disponible, setDisponible] = useState(true)
  const [guardando, setGuardando] = useState(false)

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

  const resetFormulario = () => {
    setEditandoId(null)
    setNombre('')
    setDescripcion('')
    setPrecio('')
    setCategoriaId('')
    setDisponible(true)
  }

  const iniciarEdicion = (prod: Producto) => {
    setEditandoId(prod.id)
    setNombre(prod.nombre)
    setDescripcion(prod.descripcion || '')
    setPrecio(prod.precio.toString())
    setCategoriaId(prod.categoria_id || '')
    setDisponible(prod.disponible ?? true)
  }

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !precio) return alert('Completa nombre y precio')

    setGuardando(true)
    try {
      if (editandoId) {
        // Modo Edición
        const { error } = await supabase
          .from('productos')
          .update({
            nombre,
            descripcion,
            precio: parseFloat(precio),
            categoria_id: categoriaId || null,
            disponible,
          })
          .eq('id', editandoId)

        if (error) throw error
        alert('¡Producto actualizado exitosamente!')
      } else {
        // Modo Crear
        const { error } = await supabase.from('productos').insert([
          {
            nombre,
            descripcion,
            precio: parseFloat(precio),
            categoria_id: categoriaId || null,
            disponible,
          },
        ])

        if (error) throw error
        alert('¡Producto creado exitosamente!')
      }

      resetFormulario()
      cargarDatos()
    } catch (err: any) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarProducto = async (id: string, nombreProd: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombreProd}"? Esta acción no se puede deshacer.`)) return

    try {
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      alert('Producto eliminado correctamente.')
      cargarDatos()
    } catch (err: any) {
      alert('Error eliminando producto: ' + err.message)
    }
  }

  if (cargando) return <p className="text-gray-400 text-center py-8">Cargando catálogo...</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario Crear / Editar */}
      <div className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 h-fit">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
          <h2 className="text-base font-bold text-mordiscos-orange">
            {editandoId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
          </h2>
          {editandoId && (
            <button
              onClick={resetFormulario}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleGuardarProducto} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nombre del Producto:</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
              placeholder="Ej: 12 Alitas + Papas"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Categoría:</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
            >
              <option value="">Sin Categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Precio (Bs):</label>
            <input
              type="number"
              step="0.5"
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Descripción / Detalles:</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs h-20"
              placeholder="Ej: Incluye 2 salsas a elección..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="disp"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
              className="rounded bg-gray-900 border-gray-800 text-mordiscos-orange"
            />
            <label htmlFor="disp" className="text-xs text-gray-300">
              Disponible para la venta
            </label>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-mordiscos-orange hover:bg-mordiscos-orange/90 text-white font-bold py-2.5 rounded-lg text-xs shadow-md disabled:opacity-50 mt-2"
          >
            {guardando ? 'Guardando...' : editandoId ? 'Actualizar Producto' : 'Guardar Producto'}
          </button>
        </form>
      </div>

      {/* Lista de Productos con Botones de Editar / Eliminar */}
      <div className="lg:col-span-2 bg-mordiscos-card p-5 rounded-xl border border-gray-800">
        <h2 className="text-base font-bold text-white border-b border-gray-800 pb-3 mb-4">
          Catálogo Registrado ({productos.length})
        </h2>

        <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {productos.map((prod) => {
            const catNombre = categorias.find((c) => c.id === prod.categoria_id)?.nombre || 'Sin Categ.'
            return (
              <div
                key={prod.id}
                className="flex justify-between items-center bg-gray-900/70 p-3 rounded-lg border border-gray-800 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{prod.nombre}</p>
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
                      {catNombre}
                    </span>
                  </div>
                  {prod.descripcion && <p className="text-gray-400 text-[11px] mt-0.5">{prod.descripcion}</p>}
                  <p className="text-mordiscos-accent font-extrabold mt-1">Bs {prod.precio.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => iniciarEdicion(prod)}
                    className="bg-blue-600/80 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-[11px] font-bold"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminarProducto(prod.id, prod.nombre)}
                    className="bg-red-600/80 hover:bg-red-500 text-white px-3 py-1.5 rounded text-[11px] font-bold"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}