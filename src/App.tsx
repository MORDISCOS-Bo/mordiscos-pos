import { useState } from 'react'
import PuntoVenta from './components/PuntoVenta'
import ArqueoCaja from './components/ArqueoCaja'
import Reportes from './components/Reportes'
// Si tienes los otros componentes creados, impórtalos aquí:
// import Cocina from './components/Cocina'
// import Productos from './components/Productos'

export default function App() {
  // Estado para controlar qué pestaña está activa
  const [pestañaActiva, setPestañaActiva] = useState<
    'venta' | 'cocina' | 'arqueo' | 'reportes' | 'productos'
  >('venta')

  return (
    <div className="min-h-screen bg-mordiscos-bg text-gray-100 flex flex-col font-sans">
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <header className="bg-mordiscos-card border-b border-gray-800 p-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Mordiscos Logo" className="w-8 h-8 object-contain" />
            <h1 className="font-black text-lg text-white tracking-wider">
              MORDISCOS <span className="text-mordiscos-orange text-xs font-bold">POS</span>
            </h1>
          </div>

          {/* BOTONES DE NAVEGACIÓN */}
          <nav className="flex items-center gap-1.5 bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setPestañaActiva('venta')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'venta'
                  ? 'bg-mordiscos-orange text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🛒 Punto de Venta
            </button>

            <button
              onClick={() => setPestañaActiva('cocina')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'cocina'
                  ? 'bg-mordiscos-orange text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🍳 Cocina (KDS)
            </button>

            <button
              onClick={() => setPestañaActiva('arqueo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'arqueo'
                  ? 'bg-mordiscos-orange text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💰 Arqueo de Caja
            </button>

            <button
              onClick={() => setPestañaActiva('reportes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'reportes'
                  ? 'bg-mordiscos-orange text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Reportes
            </button>

            <button
              onClick={() => setPestañaActiva('productos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'productos'
                  ? 'bg-mordiscos-orange text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 Productos
            </button>
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN LA PESTAÑA SELECCIONADA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {pestañaActiva === 'venta' && <PuntoVenta />}
        
        {pestañaActiva === 'arqueo' && <ArqueoCaja />}
        
        {pestañaActiva === 'reportes' && <Reportes />}

        {pestañaActiva === 'cocina' && (
          <div className="text-center py-12 text-gray-500 font-bold">
            🍳 Módulo de Cocina (KDS) en construcción...
          </div>
        )}

        {pestañaActiva === 'productos' && (
          <div className="text-center py-12 text-gray-500 font-bold">
            📋 Módulo de Productos en construcción...
          </div>
        )}
      </main>
    </div>
  )
}