import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface ResumenCaja {
  totalVentas: number
  totalEfectivo: number
  totalQR: number
  totalTarjeta: number
  pedidosTotales: number
  pedidosAnulados: number
}

export default function CierreCaja() {
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const [resumen, setResumen] = useState<ResumenCaja>({
    totalVentas: 0,
    totalEfectivo: 0,
    totalQR: 0,
    totalTarjeta: 0,
    pedidosTotales: 0,
    pedidosAnulados: 0,
  })
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarResumenDiario()
  }, [fecha])

  const cargarResumenDiario = async () => {
    setCargando(true)
    try {
      const inicioDia = `${fecha}T00:00:00`
      const finDia = `${fecha}T23:59:59`

      const { data, error } = await supabase
        .from('pedidos')
        .select('total, metodo_pago, estado')
        .gte('created_at', inicioDia)
        .lte('created_at', finDia)

      if (error) throw error

      if (data) {
        let total = 0
        let efectivo = 0
        let qr = 0
        let tarjeta = 0
        let anulados = 0

        data.forEach((p) => {
          if (p.estado === 'cancelado') {
            anulados++
            return
          }

          const monto = Number(p.total) || 0
          total += monto

          if (p.metodo_pago === 'efectivo') efectivo += monto
          else if (p.metodo_pago === 'qr') qr += monto
          else if (p.metodo_pago === 'tarjeta') tarjeta += monto
        })

        setResumen({
          totalVentas: total,
          totalEfectivo: efectivo,
          totalQR: qr,
          totalTarjeta: tarjeta,
          pedidosTotales: data.length - anulados,
          pedidosAnulados: anulados,
        })
      }
    } catch (err) {
      console.error('Error al obtener arqueo:', err)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📊 Cierre de Caja (Arqueo Diario)
          </h2>
          <p className="text-xs text-gray-400">Resumen y arqueo de ingresos del día</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-bold">Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-mordiscos-orange"
          />
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-400 font-bold">Calculando totales...</div>
      ) : (
        <div className="space-y-6">
          {/* Tarjeta Destacada de Gran Total */}
          <div className="bg-gradient-to-r from-mordiscos-red/20 to-mordiscos-orange/20 border border-mordiscos-orange/40 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Total Recaudado el Día</p>
            <p className="text-4xl font-black text-mordiscos-accent mt-2">
              Bs {resumen.totalVentas.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {resumen.pedidosTotales} pedidos válidos procesados
            </p>
          </div>

          {/* Métodos de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-mordiscos-card border border-gray-800 rounded-xl p-5 text-center">
              <span className="text-2xl">💵</span>
              <p className="text-xs font-bold text-gray-400 uppercase mt-2">Efectivo</p>
              <p className="text-xl font-black text-emerald-400 mt-1">
                Bs {resumen.totalEfectivo.toFixed(2)}
              </p>
            </div>

            <div className="bg-mordiscos-card border border-gray-800 rounded-xl p-5 text-center">
              <span className="text-2xl">📲</span>
              <p className="text-xs font-bold text-gray-400 uppercase mt-2">Transferencia QR</p>
              <p className="text-xl font-black text-cyan-400 mt-1">
                Bs {resumen.totalQR.toFixed(2)}
              </p>
            </div>

            <div className="bg-mordiscos-card border border-gray-800 rounded-xl p-5 text-center">
              <span className="text-2xl">💳</span>
              <p className="text-xs font-bold text-gray-400 uppercase mt-2">Tarjeta / POS</p>
              <p className="text-xl font-black text-purple-400 mt-1">
                Bs {resumen.totalTarjeta.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Estadísticas de control */}
          <div className="bg-mordiscos-card border border-gray-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold">Ventas Anuladas en esta fecha:</span>
            <span className="text-red-400 font-bold bg-red-950/40 px-3 py-1 rounded-lg border border-red-900/50">
              {resumen.pedidosAnulados} anulaciones
            </span>
          </div>
        </div>
      )}
    </div>
  )
}