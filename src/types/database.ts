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