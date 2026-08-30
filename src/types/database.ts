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
  id?: string
  numero_pedido?: number
  tipo: 'mesa' | 'llevar' | 'delivery'
  mesa?: string
  cliente_nombre?: string
  estado?: string
  total: number
  usuario_id?: string
  creado_en?: string
}