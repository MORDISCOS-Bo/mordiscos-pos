import { useState } from 'react'
import PuntoVenta from './components/PuntoVenta'
import ArqueoCaja from './components/ArqueoCaja'
import Reportes from './components/Reportes'
import CocinaKDS from './components/CocinaKDS'
import GestionProductos from './components/GestionProductos'

export default function App() {
  const [pestañaActiva, setPestañaActiva] = useState<
    'venta' | 'cocina' | 'arqueo' | 'reportes' | 'productos'
  >('venta')

  return (
    <div className="min-h-screen bg-mordiscos-bg text-gray-100 flex flex-col font-sans">
      {/* BARRA SUPERIOR DE NAVEGACIÓN */}
      <header className="bg-mordiscos-card border-b border-gray-800 p-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-[98%] mx-auto flex flex-wrap justify-between items-center gap-3">
          
          {/* LOGO Y NOMBRE */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Mordiscos Logo" className="w-9 h-9 object-contain" />
            <h1 className="font-black text-xl text-white tracking-wider">
              MORDISCOS <span className="text-mordiscos-orange text-sm font-bold ml-1">Wings Restobar</span>
            </h1>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="flex items-center gap-1.5 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setPestañaActiva('venta')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'venta'
                  ? 'bg-mordiscos-orange text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🛒 Punto de Venta
            </button>

            <button
              onClick={() => setPestañaActiva('cocina')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'cocina'
                  ? 'bg-mordiscos-orange text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🍳 Cocina (KDS)
            </button>

            <button
              onClick={() => setPestañaActiva('arqueo')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'arqueo'
                  ? 'bg-mordiscos-orange text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💰 Arqueo de Caja
            </button>

            <button
              onClick={() => setPestañaActiva('reportes')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'reportes'
                  ? 'bg-mordiscos-orange text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Reportes
            </button>

            <button
              onClick={() => setPestañaActiva('productos')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                pestañaActiva === 'productos'
                  ? 'bg-mordiscos-orange text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 Productos
            </button>
          </nav>
        </div>
      </header>

      {/* RENDERIZADO DE PANTALLAS */}
      <main className="flex-1 max-w-[98%] w-full mx-auto p-4 md:p-6">
        {pestañaActiva === 'venta' && <PuntoVenta />}
        {pestañaActiva === 'cocina' && <CocinaKDS />}
        {pestañaActiva === 'arqueo' && <ArqueoCaja />}
        {pestañaActiva === 'reportes' && <Reportes />}
        {pestañaActiva === 'productos' && <GestionProductos />}
      </main>
    </div>
  )
}