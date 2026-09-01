import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Pedido } from '../types/database'

export default function Reportes() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorMsj, setErrorMsj] = useState<string | null>(null)

  useEffect(() => {
    cargarReportes()
  }, [])

  const cargarReportes = async () => {
    setCargando(true)
    setErrorMsj(null)
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')

      if (error) {
        setErrorMsj(error.message)
      } else if (data) {
        const datosOrdenados = [...data].sort((a, b) => {
          if (a.numero_pedido && b.numero_pedido) {
            return b.numero_pedido - a.numero_pedido
          }
          const fechaA = new Date(a.created_at || a.fecha || 0).getTime()
          const fechaB = new Date(b.created_at || b.fecha || 0).getTime()
          return fechaB - fechaA
        })

        setPedidos(datosOrdenados)
      }
    } catch (err: unknown) {
      const error = err as Error
      setErrorMsj(error.message || 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  const handleAnularPedido = async (pedido: Pedido) => {
    const clave = prompt(
      `Ingresa la contraseña de autorización para anular el pedido #${pedido.numero_pedido || ''}:`
    )

    if (clave === null) return

    try {
      const { error } = await supabase.rpc('anular_pedido_con_clave', {
        p_pedido_id: pedido.id,
        p_clave: clave
      })

      if (error) throw error

      alert(`✅ Pedido #${pedido.numero_pedido || ''} anulado correctamente.`)
      cargarReportes()
    } catch (err: unknown) {
      const error = err as Error
      alert('Error al anular el pedido: ' + error.message)
    }
  }

  const pedidosValidos = pedidos.filter((p) => p.estado !== 'cancelado')
  const totalIngresos = pedidosValidos.reduce((acc, p) => acc + (p.total || 0), 0)
  const totalPedidos = pedidosValidos.length
  const pedidosMesa = pedidosValidos.filter((p) => p.tipo === 'mesa').length
  const pedidosLlevarDelivery = pedidosValidos.filter((p) => p.tipo !== 'mesa').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📊 Reporte de Ventas y Caja
          </h2>
          <p className="text-xs text-gray-400">Resumen general de ingresos e historial de comisiones</p>
        </div>
        <button
          onClick={cargarReportes}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition-all font-semibold"
        >
          🔄 Actualizar
        </button>
      </div>

      {errorMsj && (
        <div className="p-3 bg-red-900/40 border border-red-800 text-red-300 text-xs rounded-xl">
          ⚠️ <strong>Error al cargar ventas:</strong> {errorMsj}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Ingresos</p>
          <p className="text-2xl font-black text-mordiscos-orange mt-1">Bs {totalIngresos.toFixed(2)}</p>
        </div>

        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pedidos</p>
          <p className="text-2xl font-black text-white mt-1">{totalPedidos}</p>
        </div>

        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pedidos en Mesa</p>
          <p className="text-2xl font-black text-mordiscos-orange mt-1">{pedidosMesa}</p>
        </div>

        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Llevar / Delivery</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{pedidosLlevarDelivery}</p>
        </div>
      </div>

      <div className="bg-mordiscos-card rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold text-white text-sm">Historial de Comandas</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4"># Pedido</th>
                <th className="py-3 px-4">Tipo / Mesa</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Cargando reportes...
                  </td>
                </tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No hay comisiones o registros de ventas.
                  </td>
                </tr>
              ) : (
                pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-mordiscos-orange">
                      #{p.numero_pedido || 'S/N'}
                    </td>
                    <td className="py-3 px-4 text-gray-200 capitalize">
                      {p.tipo} {p.mesa ? `(${p.mesa})` : ''}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {p.cliente_nombre || 'Cliente Mostrador'}
                    </td>
                    <td className="py-3 px-4">
                      {p.estado === 'cancelado' ? (
                        <span className="bg-red-900/50 text-red-400 border border-red-800/60 px-2 py-0.5 rounded font-bold text-[10px]">
                          ANULADO
                        </span>
                      ) : (
                        <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                          {p.estado || 'pendiente'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-mordiscos-orange">
                      Bs {(p.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.estado !== 'cancelado' ? (
                        <button
                          onClick={() => handleAnularPedido(p)}
                          className="bg-red-600/80 hover:bg-red-600 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-all shadow"
                        >
                          Anular
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-600 italic">Anulado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}