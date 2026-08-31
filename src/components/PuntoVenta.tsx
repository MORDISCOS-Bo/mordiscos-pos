import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Categoria, Producto, ItemCarrito } from '../types/database'

export default function PuntoVenta() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [catSeleccionada, setCatSeleccionada] = useState<string>('todas')
  
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [tipoPedido, setTipoPedido] = useState<'mesa' | 'llevar' | 'delivery'>('mesa')
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'qr' | 'tarjeta'>('efectivo')
  const [mesa, setMesa] = useState('')
  const [cliente, setCliente] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cargarCatalogo()
  }, [])

  const cargarCatalogo = async () => {
    const { data: catData } = await supabase.from('categorias').select('*').order('nombre')
    if (catData) setCategorias(catData)

    const { data: prodData } = await supabase.from('productos').select('*').eq('disponible', true).order('nombre')
    if (prodData) setProductos(prodData)
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
        .filter(Boolean) as ItemCarrito[]
    )
  }

  const totalPedido = carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0)

  const handleCrearPedido = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío.')
    if (tipoPedido === 'mesa' && !mesa) return alert('Por favor ingresa el número o nombre de mesa.')

    setEnviando(true)
    try {
      const user = (await supabase.auth.getUser()).data.user

      const { data: pedidoGuardado, error: errPedido } = await supabase
        .from('pedidos')
        .insert([
          {
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

      alert(`¡Pedido #${pedidoGuardado.numero_pedido} enviado exitosamente! 🍗`)
      
      setCarrito([])
      setMesa('')
      setCliente('')
    } catch (err: any) {
      alert('Error enviando el pedido: ' + err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* SECCIÓN IZQUIERDA: Catálogo de Productos */}
      <div className="lg:col-span-2 space-y-4 relative">
        {/* LOGO MARCA DE AGUA SEMITRANSPARENTE EN EL CENTRO */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
          <img src="/logo.png" alt="Marca de Agua" className="max-w-xs md:max-w-md object-contain" />
        </div>

        {/* Filtro por Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin relative z-10">
          <button
            onClick={() => setCatSeleccionada('todas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              catSeleccionada === 'todas'
                ? 'bg-mordiscos-orange text-white'
                : 'bg-mordiscos-card text-gray-400 border border-gray-800'
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatSeleccionada(c.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                catSeleccionada === c.id
                  ? 'bg-mordiscos-orange text-white'
                  : 'bg-mordiscos-card text-gray-400 border border-gray-800'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {/* LISTADO DE PRODUCTOS EN MODO "TODAS" (SEPARADOS POR CATEGORÍA) O MODO FILTRADO */}
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
                        className="bg-mordiscos-card/90 backdrop-blur-sm hover:border-mordiscos-orange p-3 rounded-xl border border-gray-800 text-left transition-all flex flex-col justify-between h-28 shadow-md hover:scale-[1.02]"
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
                    className="bg-mordiscos-card/90 backdrop-blur-sm hover:border-mordiscos-orange p-3 rounded-xl border border-gray-800 text-left transition-all flex flex-col justify-between h-28 shadow-md hover:scale-[1.02]"
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
      </div>

      {/* SECCIÓN DERECHA: Comanda / Carrito */}
      <div className="bg-mordiscos-card p-5 rounded-xl border border-gray-800 flex flex-col justify-between h-[calc(100vh-140px)] sticky top-4 z-10">
        <div>
          <h3 className="text-lg font-bold text-mordiscos-orange border-b border-gray-800 pb-3 mb-4">
            Comanda Actual
          </h3>

          <div className="space-y-3 mb-4">
            <div className="flex gap-2">
              {(['mesa', 'llevar', 'delivery'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipoPedido(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    tipoPedido === t
                      ? 'bg-mordiscos-red text-white'
                      : 'bg-gray-900 text-gray-400 border border-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {tipoPedido === 'mesa' && (
                <input
                  type="text"
                  placeholder="N° Mesa (Ej: M3)"
                  value={mesa}
                  onChange={(e) => setMesa(e.target.value)}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs"
                />
              )}
              <input
                type="text"
                placeholder="Cliente (Opcional)"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className={`px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs ${
                  tipoPedido !== 'mesa' ? 'col-span-2' : ''
                }`}
              />
            </div>

            <div className="pt-2">
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Método de Pago:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['efectivo', 'qr', 'tarjeta'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetodoPago(m)}
                    className={`py-1 rounded text-[11px] font-bold uppercase border transition-all ${
                      metodoPago === m
                        ? 'bg-mordiscos-orange text-white border-mordiscos-orange'
                        : 'bg-gray-900 text-gray-400 border-gray-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {carrito.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">Selecciona productos de la izquierda</p>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.producto.id}
                  className="flex justify-between items-center p-2 bg-gray-900/60 rounded-lg border border-gray-800/80 text-xs"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-white">{item.producto.nombre}</p>
                    <p className="text-gray-400">Bs {item.producto.precio.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => modificarCantidad(item.producto.id, -1)}
                      className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded font-bold text-white flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-mono text-white font-bold">{item.cantidad}</span>
                    <button
                      onClick={() => modificarCantidad(item.producto.id, 1)}
                      className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded font-bold text-white flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 mt-4 space-y-3">
          <div className="flex justify-between text-base font-extrabold text-white">
            <span>Total:</span>
            <span className="text-mordiscos-accent">Bs {totalPedido.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCrearPedido}
            disabled={enviando || carrito.length === 0}
            className="w-full bg-gradient-to-r from-mordiscos-red to-mordiscos-orange hover:opacity-90 text-white font-bold py-3 rounded-lg text-sm shadow-lg disabled:opacity-40 transition-all"
          >
            {enviando ? 'Enviando Pedido...' : 'Confirmar y Enviar Pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}