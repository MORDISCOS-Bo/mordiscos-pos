import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface DetallePedido {
  id: string
  cantidad: number
  notas?: string
  productos: {
    nombre: string
  }
}

interface PedidoCocina {
  id: string
  numero_pedido: number
  tipo: string
  mesa?: string
  cliente_nombre?: string
  estado: string
  creado_en: string
  pedido_detalles: DetallePedido[]
}

export default function CocinaKDS() {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarPedidos()

    // Escuchar nuevos pedidos en TIEMPO REAL
    const canal = supabase
      .channel('cambios_pedidos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          cargarPedidos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  const cargarPedidos = async () => {
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
          creado_en,
          pedido_detalles (
            id,
            cantidad,
            notas,
            productos ( nombre )
          )
        `)
        .in('estado', ['pendiente', 'en_preparacion'])
        .order('creado_en', { ascending: true })

      if (error) throw error
      if (data) setPedidos(data as any)
    } catch (err: any) {
      console.error('Error cargando cocina:', err.message)
    } finally {
      setCargando(false)
    }
  }

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error
      cargarPedidos()
    } catch (err: any) {
      alert('Error cambiando estado: ' + err.message)
    }
  }

  if (cargando) {
    return <p className="text-gray-400 text-center py-8">Cargando comandas de cocina...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🍳 Pantalla de Cocina (KDS)
          </h2>
          <p className="text-xs text-gray-400">Comandas en preparación en tiempo real</p>
        </div>
        <span className="bg-mordiscos-card border border-gray-800 text-mordiscos-accent px-3 py-1 rounded-full text-xs font-mono font-bold">
          {pedidos.length} Pedido(s) Activo(s)
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-mordiscos-card p-12 rounded-xl border border-gray-800 text-center">
          <p className="text-gray-500 font-semibold text-lg">¡No hay pedidos pendientes en cocina! 🎉</p>
          <p className="text-xs text-gray-600 mt-1">Los nuevos pedidos ingresados desde el POS aparecerán aquí al instante.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidos.map((ped) => (
            <div
              key={ped.id}
              className={`rounded-xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                ped.estado === 'pendiente'
                  ? 'bg-red-950/20 border-red-800/80'
                  : 'bg-amber-950/20 border-amber-800/80'
              }`}
            >
              {/* Tarjeta de Comanda Header */}
              <div
                className={`p-3 flex justify-between items-center ${
                  ped.estado === 'pendiente' ? 'bg-red-900/60' : 'bg-amber-900/60'
                }`}
              >
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider bg-black/40 px-2 py-0.5 rounded text-white">
                    Pedido #{ped.numero_pedido}
                  </span>
                  <p className="text-xs font-semibold text-gray-200 mt-1">
                    {ped.tipo === 'mesa' ? `Mesa: ${ped.mesa}` : ped.tipo.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-200">
                    {new Date(ped.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Lista de Platos */}
              <div className="p-4 space-y-2 flex-1">
                {ped.pedido_detalles.map((det) => (
                  <div key={det.id} className="flex items-start gap-2 border-b border-gray-800/40 pb-2">
                    <span className="bg-mordiscos-orange text-white text-xs font-black px-2 py-0.5 rounded">
                      x{det.cantidad}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{det.productos?.nombre}</p>
                      {det.notas && <p className="text-xs text-amber-300 italic">{det.notas}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de Cambio de Estado */}
              <div className="p-3 bg-gray-900/80 border-t border-gray-800/80 flex gap-2">
                {ped.estado === 'pendiente' ? (
                  <button
                    onClick={() => cambiarEstado(ped.id, 'en_preparacion')}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow"
                  >
                    👨‍🍳 Iniciar Preparación
                  </button>
                ) : (
                  <button
                    onClick={() => cambiarEstado(ped.id, 'listo')}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow"
                  >
                    ✅ Marcar como Listo
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