import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria, Producto, ItemCarrito, Pedido } from '../types/database'

export default function PuntoVenta() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [catSeleccionada, setCatSeleccionada] = useState<string>('todas')

  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [tipoPedido, setTipoPedido] = useState<'mesa' | 'llevar' | 'delivery'>('mesa')
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'qr' | 'tarjeta'>('efectivo')
  const [montoRecibido, setMontoRecibido] = useState<string>('')
  const [mesa, setMesa] = useState('')
  const [cliente, setCliente] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ultimosPedidos, setUltimosPedidos] = useState<Pedido[]>([])

  useEffect(() => {
    cargarCatalogo()
    cargarUltimosPedidos()
  }, [])

  const cargarCatalogo = async () => {
    const [{ data: catData }, { data: prodData }] = await Promise.all([
      supabase.from('categorias').select('*').order('nombre'),
      supabase.from('productos').select('*').eq('disponible', true).order('nombre')
    ])
    if (catData) setCategorias(catData)
    if (prodData) setProductos(prodData)
  }

  const cargarUltimosPedidos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('id', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error al cargar últimos pedidos:', error)
      return
    }

    if (data) setUltimosPedidos(data)
  }

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id)
      if (existe) {
        return prev.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const modificarCantidad = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.producto.id === id) {
            const nuevaCantidad = item.cantidad + delta
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null
          }
          return item
        })
        .filter((item): item is ItemCarrito => item !== null)
    )
  }

  const totalPedido = carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0)
  const efectivoPagado = parseFloat(montoRecibido) || 0
  const cambioCalculado = efectivoPagado - totalPedido

  const handleCrearPedido = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío.')
    if (tipoPedido === 'mesa' && !mesa) return alert('Por favor ingresa el número o nombre de mesa.')
    if (metodoPago === 'efectivo' && efectivoPagado < totalPedido) {
      return alert(`El monto ingresado (Bs ${efectivoPagado.toFixed(2)}) es menor al total (Bs ${totalPedido.toFixed(2)}).`)
    }

    setEnviando(true)
    try {
      const user = (await supabase.auth.getUser()).data.user

      const { data: ultimos, error: errNum } = await supabase
        .from('pedidos')
        .select('numero_pedido')
        .order('numero_pedido', { ascending: false })
        .limit(1)

      if (errNum) console.warn('Aviso leyendo número anterior:', errNum)

      const ultimoNumero = ultimos && ultimos.length > 0 ? (ultimos[0].numero_pedido || 0) : 0
      const nuevoNumeroPedido = Number(ultimoNumero) + 1

      const { data: pedidoGuardado, error: errPedido } = await supabase
        .from('pedidos')
        .insert([
          {
            numero_pedido: nuevoNumeroPedido,
            tipo: tipoPedido,
            mesa: tipoPedido === 'mesa' ? mesa : null,
            cliente_nombre: cliente || 'Cliente Mostrador',
            total: totalPedido,
            metodo_pago: metodoPago,
            estado: 'pendiente',
            usuario_id: user?.id,
          },
        ])
        .select()
        .single()

      if (errPedido) throw errPedido

      const detalles = carrito.map((item) => ({
        pedido_id: pedidoGuardado.id,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio,
        subtotal: item.producto.precio * item.cantidad,
      }))

      const { error: errDetalles } = await supabase.from('pedido_detalles').insert(detalles)
      if (errDetalles) throw errDetalles

      let mensajeModal = `¡Pedido #${pedidoGuardado.numero_pedido} registrado exitosamente! 🍗`
      if (metodoPago === 'efectivo') {
        mensajeModal += `\n\n💰 Total: Bs ${totalPedido.toFixed(2)}\n💵 Pago: Bs ${efectivoPagado.toFixed(2)}\n🔄 Vuelto: Bs ${cambioCalculado.toFixed(2)}`
      }

      alert(mensajeModal)

      setCarrito([])
      setMesa('')
      setCliente('')
      setMontoRecibido('')
      cargarUltimosPedidos()
    } catch (err: unknown) {
      const error = err as Error
      alert('Error enviando el pedido: ' + error.message)
    } finally {
      setEnviando(false)
    }
  }

  const handleAnularPedido = async (pedido: Pedido) => {
    const clave = prompt(`Ingresa la contraseña de autorización para anular el pedido #${pedido.numero_pedido || ''}:`)
    if (clave === null) return

    try {
      const { error } = await supabase.rpc('anular_pedido_con_clave', {
        p_pedido_id: pedido.id,
        p_clave: clave
      })

      if (error) throw error

      alert(`✅ Venta #${pedido.numero_pedido || ''} anulada correctamente.`)
      cargarUltimosPedidos()
    } catch (err: unknown) {
      const error = err as Error
      alert('Error al anular la venta: ' + error.message)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      <div className="lg:col-span-2 space-y-6 relative min-h-[500px]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-15 overflow-hidden">
          <img 
            src="/logo.png" 
            alt="Marca de Agua Mordiscos" 
            className="w-full max-w-xl md:max-w-2xl object-contain filter drop-shadow-lg" 
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin relative z-10">
          <button
            onClick={() => setCatSeleccionada('todas')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${
              catSeleccionada === 'todas'
                ? 'bg-mordiscos-orange text-white'
                : 'bg-mordiscos-card text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatSeleccionada(c.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${
                catSeleccionada === c.id
                  ? 'bg-mordiscos-orange text-white'
                  : 'bg-mordiscos-card text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <div className="space-y-6 relative z-10">
          {catSeleccionada === 'todas' ? (
            categorias.map((cat) => {
              const prodsCat = productos.filter((p) => p.categoria_id === cat.id)
              if (prodsCat.length === 0) return null

              return (
                <div key={cat.id} className="space-y-2">
                  <h3 className="text-xs font-bold text-mordiscos-orange uppercase tracking-wider border-b border-gray-800/80 pb-1">
                    {cat.nombre}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {prodsCat.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => agregarAlCarrito(prod)}
                        className="bg-mordiscos-card/80 backdrop-blur-md hover:border-mordiscos-orange p-3.5 rounded-xl border border-gray-800/90 text-left transition-all flex flex-col justify-between h-28 shadow-md hover:scale-[1.02]"
                      >
                        <div>
                          <p className="font-bold text-white text-sm line-clamp-2">{prod.nombre}</p>
                          {prod.descripcion && (
                            <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">{prod.descripcion}</p>
                          )}
                        </div>
                        <p className="text-mordiscos-accent font-extrabold text-sm">Bs {prod.precio.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productos
                .filter((p) => p.categoria_id === catSeleccionada)
                .map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => agregarAlCarrito(prod)}
                    className="bg-mordiscos-card/80 backdrop-blur-md hover:border-mordiscos-orange p-3.5 rounded-xl border border-gray-800/90 text-left transition-all flex flex-col justify-between h-28 shadow-md hover:scale-[1.02]"
                  >
                    <div>
                      <p className="font-bold text-white text-sm line-clamp-2">{prod.nombre}</p>
                      {prod.descripcion && (
                        <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">{prod.descripcion}</p>
                      )}
                    </div>
                    <p className="text-mordiscos-accent font-extrabold text-sm">Bs {prod.precio.toFixed(2)}</p>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="relative z-10 pt-6 border-t border-gray-800">
          <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center justify-between">
            <span>Últimas Ventas Realizadas</span>
            <span className="text-[10px] font-normal text-gray-500">(Para anular errores)</span>
          </h3>

          <div className="space-y-2">
            {ultimosPedidos.length === 0 ? (
              <p className="text-xs text-gray-500">No hay ventas recientes.</p>
            ) : (
              ultimosPedidos.map((ped) => (
                <div
                  key={ped.id}
                  className="flex items-center justify-between p-3 bg-mordiscos-card/90 backdrop-blur-sm rounded-xl border border-gray-800/80 text-xs shadow-sm"
                >
                  <div>
                    <span className="font-bold text-white text-sm">#{ped.numero_pedido || 'S/N'}</span>
                    <span className="text-gray-400 ml-2 capitalize font-medium">({ped.tipo})</span>
                    <span className="text-mordiscos-accent font-extrabold ml-3">Bs {ped.total.toFixed(2)}</span>
                  </div>

                  {ped.estado === 'cancelado' ? (
                    <span className="text-[10px] bg-red-900/50 text-red-400 border border-red-800/50 px-2.5 py-1 rounded-lg font-bold">
                      ANULADO
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAnularPedido(ped)}
                      className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow"
                    >
                      Anular Venta
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: COMANDA ACTUAL */}
      <div className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 flex flex-col justify-between h-[calc(100vh-140px)] sticky top-4 z-10 shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-mordiscos-orange border-b border-gray-800 pb-3 mb-4 flex items-center justify-between">
            <span>Comanda Actual</span>
            {carrito.length > 0 && (
              <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
                {carrito.reduce((acc, i) => acc + i.cantidad, 0)} ítems
              </span>
            )}
          </h3>

          <div className="space-y-4 mb-4">
            {/* BOTONES DE TIPO DE PEDIDO (MÁS GRANDES) */}
            <div className="grid grid-cols-3 gap-2">
              {(['mesa', 'llevar', 'delivery'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipoPedido(t)}
                  className={`py-3.5 rounded-xl text-sm font-extrabold capitalize transition-all border shadow-sm ${
                    tipoPedido === t
                      ? 'bg-mordiscos-red text-white border-mordiscos-red ring-2 ring-mordiscos-red/40'
                      : 'bg-gray-900/90 text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* CAMPOS MESA Y CLIENTE */}
            <div className="grid grid-cols-2 gap-2">
              {tipoPedido === 'mesa' && (
                <input
                  type="text"
                  placeholder="N° Mesa (Ej: M3)"
                  value={mesa}
                  onChange={(e) => setMesa(e.target.value)}
                  className="px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-xs font-semibold focus:border-mordiscos-orange outline-none"
                />
              )}
              <input
                type="text"
                placeholder="Cliente (Opcional)"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className={`px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-xs font-semibold focus:border-mordiscos-orange outline-none ${
                  tipoPedido !== 'mesa' ? 'col-span-2' : ''
                }`}
              />
            </div>

            {/* BOTONES MÉTODO DE PAGO (MÁS GRANDES) */}
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">
                MÉTODO DE PAGO:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['efectivo', 'qr', 'tarjeta'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetodoPago(m)}
                    className={`py-3 rounded-xl text-xs font-extrabold uppercase transition-all border shadow-sm ${
                      metodoPago === m
                        ? 'bg-mordiscos-orange text-white border-mordiscos-orange ring-2 ring-mordiscos-orange/40'
                        : 'bg-gray-900/90 text-gray-300 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* CALCULADORA DE VUELTOS (SÓLO SI ES EFECTIVO) */}
            {metodoPago === 'efectivo' && (
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-300">Paga con (Bs):</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="w-28 px-3 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-right text-white font-extrabold text-sm focus:border-mordiscos-orange outline-none"
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-800">
                  <span className="text-gray-400 font-semibold">Vuelto:</span>
                  <span
                    className={`font-black text-sm ${
                      cambioCalculado < 0
                        ? 'text-red-400'
                        : efectivoPagado > 0
                        ? 'text-emerald-400'
                        : 'text-gray-500'
                    }`}
                  >
                    Bs {cambioCalculado > 0 ? cambioCalculado.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* LISTA DE ÍTEMS EN CARRITO */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {carrito.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6 font-medium">
                Selecciona productos de la izquierda
              </p>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.producto.id}
                  className="flex justify-between items-center p-2.5 bg-gray-900/60 rounded-xl border border-gray-800/80 text-xs"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-white">{item.producto.nombre}</p>
                    <p className="text-gray-400 text-[11px]">Bs {item.producto.precio.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => modificarCantidad(item.producto.id, -1)}
                      className="w-7 h-7 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-lg font-bold text-white flex items-center justify-center text-sm shadow"
                    >
                      -
                    </button>
                    <span className="font-mono text-white font-bold px-1">{item.cantidad}</span>
                    <button
                      onClick={() => modificarCantidad(item.producto.id, 1)}
                      className="w-7 h-7 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-lg font-bold text-white flex items-center justify-center text-sm shadow"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TOTAL Y CONFIRMACIÓN */}
        <div className="border-t border-gray-800 pt-4 mt-4 space-y-3">
          <div className="flex justify-between text-base font-extrabold text-white">
            <span>Total:</span>
            <span className="text-mordiscos-accent text-xl">Bs {totalPedido.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCrearPedido}
            disabled={enviando || carrito.length === 0}
            className="w-full bg-gradient-to-r from-mordiscos-red to-mordiscos-orange hover:opacity-90 active:scale-[0.99] text-white font-black py-4 rounded-xl text-base shadow-xl disabled:opacity-40 transition-all uppercase tracking-wide"
          >
            {enviando ? 'Enviando Pedido...' : 'Confirmar y Enviar Pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}