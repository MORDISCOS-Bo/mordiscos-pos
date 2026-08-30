import { useState } from 'react'

export default function App() {
  const [ventasHoy] = useState(0)

  return (
    <div className="min-h-screen bg-mordiscos-dark text-white p-4 sm:p-6">
      {/* Encabezado Principal */}
      <header className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mordiscos-orange flex items-center gap-2">
            🍗 MORDISCOS
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">Wings-Restobar POS</p>
        </div>
        <span className="bg-mordiscos-red/20 text-mordiscos-red px-3 py-1 rounded-full text-xs font-semibold border border-mordiscos-red/30">
          Modo Local (Fase 1)
        </span>
      </header>

      {/* Grid Resumen Adaptable (PC y Celular) */}
      <main className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tarjeta 1: Ventas */}
        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Ventas de Hoy</p>
          <p className="text-3xl font-extrabold text-mordiscos-accent mt-1">Bs {ventasHoy}</p>
        </div>

        {/* Tarjeta 2: Estado de Caja */}
        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Estado de Caja</p>
          <p className="text-xl font-bold text-green-500 mt-2 font-mono">CERRADA</p>
        </div>

        {/* Tarjeta 3: Estado del Sistema */}
        <div className="bg-mordiscos-card p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Base de Datos</p>
          <p className="text-sm font-medium text-gray-300 mt-2">
            Listo para conectar a Supabase
          </p>
        </div>
      </main>

      {/* Mensaje Informativo */}
      <div className="max-w-4xl mx-auto mt-8 p-4 bg-mordiscos-card border border-mordiscos-orange/30 rounded-xl text-center">
        <p className="text-sm text-gray-300">
          🚀 <strong className="text-mordiscos-orange">¡Fase 1 completada con éxito!</strong> Entorno configurado con React, Vite, TypeScript y Tailwind CSS.
        </p>
      </div>
    </div>
  )
}