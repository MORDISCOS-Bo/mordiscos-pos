import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Pedido } from '../types/database'

export default function ArqueoCaja() {
  const [montoInicial, setMontoInicial] = useState<number>(0)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarVentas()
  }, [])

  const cargarVentas = async () => {
    setCargando(true)
    try {
      // Traemos los pedidos de Supabase
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')

      if (error) {
        console.error('Error al cargar pedidos para arqueo:', error)
      } else if (data) {
        setPedidos(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setCargando(false)
    }
  }

  // ⚠️ CRUCIAL: Excluir explícitamente las ventas anuladas / canceladas
  const pedidosValidos = pedidos.filter((p) => p.estado !== 'cancelado')

  // Desglose por método de pago solo con pedidos válidos
  const ventasEfectivo = pedidosValidos
    .filter((p) => p.metodo_pago === 'efectivo')
    .reduce((acc, p) => acc + (p.total || 0), 0)

  const ventasQR = pedidosValidos
    .filter((p) => p.metodo_pago === 'qr')
    .reduce((acc, p) => acc + (p.total || 0), 0)

  const ventasTarjeta = pedidosValidos
    .filter((p) => p.metodo_pago === 'tarjeta')
    .reduce((acc, p) => acc + (p.total || 0), 0)

  const totalVentas = ventasEfectivo + ventasQR + ventasTarjeta
  const totalEfectivoEsperado = montoInicial + ventasEfectivo

  const handleGuardarCierre = async () => {
    setGuardando(true)
    try {
      const user = (await supabase.auth.getUser()).data.user

      const { error } = await supabase.from('arqueo_caja').insert([
        {
          monto_inicial: montoInicial,
          ventas_efectivo: ventasEfectivo,
          ventas_qr: ventasQR,
          ventas_tarjeta: ventasTarjeta,
          total_ventas: totalVentas,
          total_efectivo_esperado: totalEfectivoEsperado,
          usuario_id: user?.id,
        },
      ])

      if (error) throw error

      alert('✅ ¡Cierre de caja registrado exitosamente!')
    } catch (err: any) {
      alert('Error al guardar el cierre de caja: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            💰 Arqueo y Cierre de Caja
          </h2>
          <p className="text-xs text-gray-400">Control de flujo de dinero del día</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. FONDO DE CAJA */}
        <div className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-mordiscos-orange uppercase tracking-wider">
            1. FONDO DE CAJA
          </h3>
          <div>
            <label className="text-xs text-gray-300 block mb-2 font-medium">
              Monto Inicial en Efectivo (Bs):
            </label>
            <input
              type="number"
              value={montoInicial || ''}
              onChange={(e) => setMontoInicial(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white font-bold text-lg focus:outline-none focus:border-mordiscos-orange"
            />
          </div>
        </div>

        {/* 2. DESGLOSE DE VENTAS */}
        <div className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-mordiscos-orange uppercase tracking-wider">
            2. DESGLOSE DE VENTAS
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-gray-800/60">
              <span className="text-gray-300 flex items-center gap-2">💵 Ventas Efectivo:</span>
              <span className="font-extrabold text-white text-sm">Bs {ventasEfectivo.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-800/60">
              <span className="text-gray-300 flex items-center gap-2">📱 Ventas QR:</span>
              <span className="font-extrabold text-white text-sm">Bs {ventasQR.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-800/60">
              <span className="text-gray-300 flex items-center gap-2">💳 Ventas Tarjeta:</span>
              <span className="font-extrabold text-white text-sm">Bs {ventasTarjeta.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-sm">
              <span className="text-mordiscos-orange">Total Ventas:</span>
              <span className="text-mordiscos-orange text-base font-black">Bs {totalVentas.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOTAL ESPERADO */}
      <div className="bg-mordiscos-card p-6 rounded-xl border border-gray-800 text-center space-y-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            TOTAL EFECTIVO FÍSICO ESPERADO EN CAJA
          </p>
          <p className="text-3xl font-black text-emerald-400 mt-2">
            Bs {totalEfectivoEsperado.toFixed(2)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">(Monto Inicial + Ventas en Efectivo)</p>
        </div>

        <button
          onClick={handleGuardarCierre}
          disabled={guardando || cargando}
          className="bg-mordiscos-orange hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg disabled:opacity-50"
        >
          {guardando ? 'Guardando Cierre...' : '🔒 Confirmar y Guardar Cierre de Caja'}
        </button>
      </div>
    </div>
  )
}