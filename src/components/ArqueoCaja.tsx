import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

export default function ArqueoCaja() {
  const [montoInicial, setMontoInicial] = useState<number>(0)
  const [ventasEfectivo, setVentasEfectivo] = useState<number>(0)
  const [ventasQR, setVentasQR] = useState<number>(0)
  const [ventasTarjeta, setVentasTarjeta] = useState<number>(0)
  const [pedidosHoy, setPedidosHoy] = useState<any[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [guardando, setGuardando] = useState<boolean>(false)

  useEffect(() => {
    calcularVentasDelDia()
  }, [])

  const calcularVentasDelDia = async () => {
    setCargando(true)
    const hoyInicio = new Date()
    hoyInicio.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('creado_en', hoyInicio.toISOString())
      .order('creado_en', { ascending: false })

    if (error) {
      console.error(error)
      setCargando(false)
      return
    }

    if (data) {
      setPedidosHoy(data)

      let ef = 0, qr = 0, tj = 0
      data.forEach((p) => {
        const total = Number(p.total) || 0
        if (p.metodo_pago === 'qr') qr += total
        else if (p.metodo_pago === 'tarjeta') tj += total
        else ef += total
      })

      setVentasEfectivo(ef)
      setVentasQR(qr)
      setVentasTarjeta(tj)
    }
    setCargando(false)
  }

  const totalSistema = ventasEfectivo + ventasQR + ventasTarjeta
  const totalEfectivoEnCaja = montoInicial + ventasEfectivo

  const exportarAExcel = () => {
    // 1. Hoja de Resumen de Arqueo
    const resumenData = [
      { Concepto: 'Monto Inicial en Caja (Fondo)', Monto_Bs: montoInicial },
      { Concepto: 'Ventas en Efectivo', Monto_Bs: ventasEfectivo },
      { Concepto: 'Ventas por QR', Monto_Bs: ventasQR },
      { Concepto: 'Ventas por Tarjeta', Monto_Bs: ventasTarjeta },
      { Concepto: 'TOTAL VENTAS DEL DÍA', Monto_Bs: totalSistema },
      { Concepto: 'TOTAL EFECTIVO ESPERADO EN CAJA', Monto_Bs: totalEfectivoEnCaja },
    ]

    // 2. Hoja de Detalle de Pedidos
    const detallesData = pedidosHoy.map((p) => ({
      Nro_Pedido: p.numero_pedido,
      Tipo: p.tipo,
      Mesa: p.mesa || '-',
      Cliente: p.cliente_nombre || 'Mostrador',
      Metodo_Pago: (p.metodo_pago || 'efectivo').toUpperCase(),
      Total_Bs: Number(p.total),
      Hora: new Date(p.creado_en).toLocaleTimeString(),
    }))

    const wb = XLSX.utils.book_new()
    const wsResumen = XLSX.utils.json_to_sheet(resumenData)
    const wsDetalles = XLSX.utils.json_to_sheet(detallesData)

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Arqueo')
    XLSX.utils.book_append_sheet(wb, wsDetalles, 'Detalle Pedidos')

    const fechaStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Arqueo_Caja_Mordiscos_${fechaStr}.xlsx`)
  }

  const guardarCierre = async () => {
    setGuardando(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      const { error } = await supabase.from('cierres_caja').insert([
        {
          usuario_id: user?.id,
          monto_inicial: montoInicial,
          ventas_efectivo: ventasEfectivo,
          ventas_qr: ventasQR,
          ventas_tarjeta: ventasTarjeta,
          total_recaudado: totalSistema,
        },
      ])

      if (error) throw error
      alert('¡Cierre de caja guardado con éxito!')
      exportarAExcel()
    } catch (err: any) {
      alert('Error guardando cierre: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <p className="text-gray-400 text-center py-8">Cargando datos de caja...</p>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">💰 Arqueo y Cierre de Caja</h2>
          <p className="text-xs text-gray-400">Control de flujo de dinero del día</p>
        </div>
        <button
          onClick={exportarAExcel}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow flex items-center gap-2"
        >
          📊 Descargar Reporte en Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Configuración Fondo Inicial */}
        <div className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-sm font-bold text-mordiscos-orange uppercase">1. Fondo de Caja</h3>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Monto Inicial en Efectivo (Bs):</label>
            <input
              type="number"
              value={montoInicial}
              onChange={(e) => setMontoInicial(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white font-mono font-bold text-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Totales por Método de Pago */}
        <div className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 space-y-2 text-xs">
          <h3 className="text-sm font-bold text-mordiscos-orange uppercase mb-2">2. Desglose de Ventas</h3>
          <div className="flex justify-between py-1 border-b border-gray-800 text-gray-300">
            <span>💵 Ventas Efectivo:</span>
            <span className="font-mono font-bold text-white">Bs {ventasEfectivo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-800 text-gray-300">
            <span>📱 Ventas QR:</span>
            <span className="font-mono font-bold text-white">Bs {ventasQR.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-800 text-gray-300">
            <span>💳 Ventas Tarjeta:</span>
            <span className="font-mono font-bold text-white">Bs {ventasTarjeta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-sm font-extrabold text-mordiscos-accent border-t border-gray-700">
            <span>Total Ventas:</span>
            <span>Bs {totalSistema.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Caja Final y Cierre */}
      <div className="bg-gray-900 p-6 rounded-xl border border-mordiscos-orange/30 text-center space-y-4">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold">Total Efectivo Físico Esperado en Caja</p>
          <p className="text-3xl font-black text-green-400 mt-1 font-mono">
            Bs {totalEfectivoEnCaja.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">(Monto Inicial + Ventas en Efectivo)</p>
        </div>

        <button
          onClick={guardarCierre}
          disabled={guardando}
          className="bg-mordiscos-orange hover:bg-mordiscos-orange/90 text-white font-bold px-6 py-3 rounded-lg text-sm shadow-lg disabled:opacity-50"
        >
          {guardando ? 'Guardando Cierre...' : '🔒 Confirmar y Guardar Cierre de Caja'}
        </button>
      </div>
    </div>
  )
}