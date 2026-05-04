import React from 'react';

const Buscador = ({ 
  filtroOrigen, setFiltroOrigen, 
  filtroDestino, setFiltroDestino, 
  precioMax, setPrecioMax,
  aerolineaSeleccionada, setAerolineaSeleccionada, // Nuevas props
  aerolineas, // Lista de aerolíneas desde la DB
  onBuscar, onLimpiar 
}) => {
  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-10 transition-all">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"> {/* Cambiado a lg:grid-cols-5 */}
        
        {/* Origen */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-wider">Origen</label>
          <input 
            type="text" 
            placeholder="¿Desde dónde?" 
            value={filtroOrigen} 
            onChange={(e) => setFiltroOrigen(e.target.value)} 
            className="w-full border-0 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
          />
        </div>

        {/* Destino */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-wider">Destino</label>
          <input 
            type="text" 
            placeholder="¿A dónde vas?" 
            value={filtroDestino} 
            onChange={(e) => setFiltroDestino(e.target.value)} 
            className="w-full border-0 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
          />
        </div>

        {/* Aerolínea (Nuevo Selector) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-wider">Aerolínea</label>
          <select 
            value={aerolineaSeleccionada}
            onChange={(e) => setAerolineaSeleccionada(e.target.value)}
            className="w-full border-0 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-600 font-medium appearance-none"
          >
            <option value="">Todas las compañías</option>
            {aerolineas.map((a) => (
              <option key={a.id} value={a.nombre}>{a.nombre}</option>
            ))}
          </select>
        </div>

        {/* Slider de Precio */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Máx: {precioMax}€</label>
          </div>
          <input 
            type="range" 
            min="0" max="2000" step="50"
            value={precioMax} 
            onChange={(e) => setPrecioMax(Number(e.target.value))} 
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button 
            onClick={onBuscar} 
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            🔍
          </button>
          <button 
            onClick={onLimpiar} 
            className="bg-slate-100 text-slate-500 font-bold px-4 py-3 rounded-xl hover:bg-slate-200 transition-all"
          >
            🧹
          </button>
        </div>
      </div>
    </div>
  );
};

export default Buscador;