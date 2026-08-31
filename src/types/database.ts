export interface Categoria {
  id: string
  nombre: string
  descripcion?: string
  activo?: boolean
}

export interface Producto {
  id: string
  categoria_id: string
  nombre: string
  descripcion?: string
  precio: number
  costo: number
  imagen_url?: string
  disponible: boolean
  creado_en?: string
}

export interface ItemCarrito {
  producto: Producto
  cantidad: number
  notas?: string
}

export interface Pedido {
  id: string
  numero_pedido?: number
  tipo: 'mesa' | 'llevar' | 'delivery'
  mesa?: string | null
  cliente_nombre?: string | null
  total: number
  metodo_pago: 'efectivo' | 'qr' | 'tarjeta'
  estado: 'pendiente' | 'en_preparacion' | 'completado' | 'cancelado' // <-- Asegúrate de incluir 'cancelado'
  created_at?: string
  usuario_id?: string
}