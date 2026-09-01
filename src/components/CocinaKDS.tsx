import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface DetallePedido {
  id: string
  cantidad: number
  productos: {
    nombre: string
  } | null
}

interface PedidoCocina {
  id: string
  numero_pedido: number
  tipo: string
  mesa: string | null
  cliente_nombre: string
  estado: string
  created_at: string
  pedido_detalles: DetallePedido[]
}

export default function Cocina() {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarPedidosCocina()
    // Suscripción en tiempo real para nuevos pedidos
    const channel = supabase
      .channel('cambios-cocina')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        cargarPedidosCocina()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const cargarPedidosCocina = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          numero_pedido,
          tipo,
          mesa,
          cliente_nombre,
          estado,
          created_at,
          pedido_detalles (
            id,
            cantidad,
            productos (
              nombre
            )
          )
        `)
        .in('estado', ['pendiente', 'en_preparacion'])
        .order('created_at', { ascending: true })

      if (error) console.error('Error cargando comanda:', error)
      else if (data) setPedidos(data as any)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const cambiarEstadoPedido = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error
      cargarPedidosCocina()
    } catch (err: any) {
      alert('Error cambiando estado: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🍳 Pantalla de Cocina (KDS)
          </h2>
          <p className="text-xs text-gray-400">Comandas en tiempo real para preparación</p>
        </div>
        <button
          onClick={cargarPedidosCocina}
          className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700"
        >
          🔄 Actualizar
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-400 font-bold">Cargando comandas...</div>
      ) : pedidos.length === 0 ? (
        <div className="bg-mordiscos-card border border-gray-800 rounded-xl p-12 text-center text-gray-500">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-bold text-sm">¡No hay pedidos pendientes en cocina!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pedidos.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 shadow-md ${
                p.estado === 'en_preparacion'
                  ? 'bg-amber-950/30 border-amber-600/50'
                  : 'bg-mordiscos-card border-gray-800'
              }`}
            >
              <div>
                <div className="flex justify-between items-start border-b border-gray-800 pb-2 mb-3">
                  <div>
                    <span className="text-2xl font-black text-white">#{p.numero_pedido || 'S/N'}</span>
                    <p className="text-xs font-bold text-mordiscos-orange capitalize">
                      {p.tipo} {p.mesa ? `- Mesa: ${p.mesa}` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      p.estado === 'en_preparacion'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {p.estado === 'en_preparacion' ? 'Preparando' : 'Pendiente'}
                  </span>
                </div>

                <p className="text-xs text-gray-400 font-medium mb-3">Cliente: {p.cliente_nombre}</p>

                {/* Lista de Items */}
                <div className="space-y-1.5">
                  {p.pedido_detalles?.map((det) => (
                    <div key={det.id} className="flex justify-between text-xs font-semibold text-gray-200">
                      <span>{det.productos?.nombre || 'Producto'}</span>
                      <span className="font-bold text-mordiscos-orange">x{det.cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 border-t border-gray-800/80 flex gap-2">
                {p.estado === 'pendiente' ? (
                  <button
                    onClick={() => cambiarEstadoPedido(p.id, 'en_preparacion')}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    🔥 Iniciar Preparación
                  </button>
                ) : (
                  <button
                    onClick={() => cambiarEstadoPedido(p.id, 'completado')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    ✅ Marcar Listo / Entregado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}