import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Buscador = ({ 
  filtroOrigen, setFiltroOrigen, 
  filtroDestino, setFiltroDestino, 
  precioMax, setPrecioMax,
  aerolineaSeleccionada, setAerolineaSeleccionada,
  aerolineas, 
  onBuscar, onLimpiar 
}) => {

  // 🔹 ESTADOS PARA EL AUTOCOMPLETADO
  const [ciudades, setCiudades] = useState([]);
  const [sugerenciasOrigen, setSugerenciasOrigen] = useState([]);
  const [mostrarSugOrigen, setMostrarSugOrigen] = useState(false);
  const [sugerenciasDestino, setSugerenciasDestino] = useState([]);
  const [mostrarSugDestino, setMostrarSugDestino] = useState(false);

  // 🔹 Cargar ciudades únicas desde Supabase al montar el componente
  useEffect(() => {
    const cargarCiudades = async () => {
      const { data } = await supabase.from("vuelos").select("origen, destino");
      if (data) {
        const todasLasCiudades = data.flatMap(v => [v.origen, v.destino]);
        const ciudadesUnicas = [...new Set(todasLasCiudades)];
        setCiudades(ciudadesUnicas);
      }
    };
    cargarCiudades();
  }, []);

  // 🔹 MANEJADORES DE ORIGEN
  const handleOrigenChange = (e) => {
    const valor = e.target.value;
    setFiltroOrigen(valor);
    if (valor.length > 0) {
      setSugerenciasOrigen(ciudades.filter(c => c.toLowerCase().includes(valor.toLowerCase())));
      setMostrarSugOrigen(true);
    } else {
      setMostrarSugOrigen(false);
    }
  };

  const seleccionarOrigen = (ciudad) => {
    setFiltroOrigen(ciudad);
    setMostrarSugOrigen(false);
  };

  // 🔹 MANEJADORES DE DESTINO
  const handleDestinoChange = (e) => {
    const valor = e.target.value;
    setFiltroDestino(valor);
    if (valor.length > 0) {
      setSugerenciasDestino(ciudades.filter(c => c.toLowerCase().includes(valor.toLowerCase())));
      setMostrarSugDestino(true);
    } else {
      setMostrarSugDestino(false);
    }
  };

  const seleccionarDestino = (ciudad) => {
    setFiltroDestino(ciudad);
    setMostrarSugDestino(false);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-10 transition-all text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        
        {/* Origen Inteligente */}
        <div className="space-y-2 relative">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-wider">Origen</label>
          <input 
            type="text" 
            placeholder="¿Desde dónde?" 
            value={filtroOrigen} 
            onChange={handleOrigenChange} 
            className="w-full border-0 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
          />
          {mostrarSugOrigen && sugerenciasOrigen.length > 0 && (
            <ul className="absolute z-50 w-full top-[100%] left-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {sugerenciasOrigen.map((ciudad, idx) => (
                <li key={idx} onClick={() => seleccionarOrigen(ciudad)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 text-sm">📍 {ciudad}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Destino Inteligente */}
        <div className="space-y-2 relative">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-wider">Destino</label>
          <input 
            type="text" 
            placeholder="¿A dónde vas?" 
            value={filtroDestino} 
            onChange={handleDestinoChange} 
            className="w-full border-0 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
          />
          {mostrarSugDestino && sugerenciasDestino.length > 0 && (
            <ul className="absolute z-50 w-full top-[100%] left-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {sugerenciasDestino.map((ciudad, idx) => (
                <li key={idx} onClick={() => seleccionarDestino(ciudad)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 text-sm">📍 {ciudad}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Aerolínea (Intacto) */}
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

        {/* Slider de Precio (Intacto) */}
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

        {/* Botones (Intactos) */}
        <div className="flex gap-2">
          <button onClick={onBuscar} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
            🔍
          </button>
          <button onClick={onLimpiar} className="bg-slate-100 text-slate-500 font-bold px-4 py-3 rounded-xl hover:bg-slate-200 transition-all">
            🧹
          </button>
        </div>
      </div>
    </div>
  );
};

export default Buscador;