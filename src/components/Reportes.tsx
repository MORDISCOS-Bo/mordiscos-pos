import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface ResumenVentas {
  totalVendido: number
  totalPedidos: number
  pedidosMesa: number
  pedidosLlevar: number
  pedidosDelivery: number
}

interface PedidoHistorial {
  id: string
  numero_pedido: number
  tipo: string
  mesa?: string
  cliente_nombre?: string
  total: number
  estado: string
  creado_en: string
}

export default function Reportes() {
  const [resumen, setResumen] = useState<ResumenVentas>({
    totalVendido: 0,
    totalPedidos: 0,
    pedidosMesa: 0,
    pedidosLlevar: 0,
    pedidosDelivery: 0,
  })
  const [historial, setHistorial] = useState<PedidoHistorial[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarReportes()
  }, [])

  const cargarReportes = async () => {
    setCargando(true)
    try {
      // Cargar todos los pedidos registrados
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('creado_en', { ascending: false })

      if (error) throw error

      if (data) {
        setHistorial(data)

        // Calcular métricas
        const totalV = data.reduce((acc, p) => acc + Number(p.total), 0)
        const mesa = data.filter((p) => p.tipo === 'mesa').length
        const llevar = data.filter((p) => p.tipo === 'llevar').length
        const delivery = data.filter((p) => p.tipo === 'delivery').length

        setResumen({
          totalVendido: totalV,
          totalPedidos: data.length,
          pedidosMesa: mesa,
          pedidosLlevar: llevar,
          pedidosDelivery: delivery,
        })
      }
    } catch (err: any) {
      console.error('Error cargando reportes:', err.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return <p className="text-gray-400 text-center py-8">Calculando métricas de caja...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📊 Reporte de Ventas y Caja
        </h2>
        <p className="text-xs text-gray-400">Resumen general de ingresos e historial de comisiones</p>
      </div>

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800 shadow">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Ingresos</p>
          <p className="text-2xl font-black text-mordiscos-accent mt-1">
            Bs {resumen.totalVendido.toFixed(2)}
          </p>
        </div>

        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800 shadow">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Pedidos</p>
          <p className="text-2xl font-black text-white mt-1">{resumen.totalPedidos}</p>
        </div>

        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800 shadow">
          <p className="text-xs text-gray-400 font-semibold uppercase">Pedidos en Mesa</p>
          <p className="text-2xl font-black text-mordiscos-orange mt-1">{resumen.pedidosMesa}</p>
        </div>

        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800 shadow">
          <p className="text-xs text-gray-400 font-semibold uppercase">Llevar / Delivery</p>
          <p className="text-2xl font-black text-blue-400 mt-1">
            {resumen.pedidosLlevar + resumen.pedidosDelivery}
          </p>
        </div>
      </div>

      {/* Tabla de Historial de Pedidos */}
      <div className="bg-mordiscos-card rounded-xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-md font-bold text-white">Historial de Comandas</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 uppercase text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3"># Pedido</th>
                <th className="p-3">Tipo / Mesa</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Hora</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {historial.map((p) => (
                <tr key={p.id} className="hover:bg-gray-900/40">
                  <td className="p-3 font-mono font-bold text-mordiscos-orange">#{p.numero_pedido}</td>
                  <td className="p-3 capitalize font-semibold">
                    {p.tipo} {p.mesa ? `(${p.mesa})` : ''}
                  </td>
                  <td className="p-3 text-gray-400">{p.cliente_nombre || 'Mostrador'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.estado === 'listo'
                          ? 'bg-green-900/40 text-green-400 border border-green-800'
                          : p.estado === 'en_preparacion'
                          ? 'bg-amber-900/40 text-amber-400 border border-amber-800'
                          : 'bg-red-900/40 text-red-400 border border-red-800'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">
                    {new Date(p.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 text-right font-extrabold text-mordiscos-accent">
                    Bs {Number(p.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}