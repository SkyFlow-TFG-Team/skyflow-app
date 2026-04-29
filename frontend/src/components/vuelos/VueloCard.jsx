import React from 'react';

const VueloCard = ({ vuelo, perfil, onEliminar, onReservar }) => {
  // Lógica de colores y porcentajes para la barra de plazas
  const porcentaje = (vuelo.plazas_disponibles / vuelo.plazas_totales) * 100;
  const esAdmin = perfil?.rol === "admin";
  const esCliente = !perfil || perfil?.rol === "cliente";

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col h-full">
      
      {/* CABECERA DINÁMICA */}
      <div className="bg-blue-600 p-3 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tracking-widest font-bold">VUELO #{vuelo.id.slice(0, 6)}</span>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full uppercase font-bold backdrop-blur-sm">
            {vuelo.plazas_disponibles > 0 ? 'Disponible' : 'Agotado'}
          </span>
        </div>
        
        {/* Solo el Admin ve el botón de borrar aquí arriba */}
        {esAdmin && onEliminar && (
          <button 
            onClick={() => onEliminar(vuelo.id)} 
            className="text-[10px] bg-red-500/30 hover:bg-red-500 text-white border border-white/20 px-3 py-1 rounded-full uppercase font-bold transition-all"
          >
            Borrar
          </button>
        )}
      </div>

      <div className="p-6 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800 uppercase">{vuelo.origen}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Origen</p>
          </div>
          <div className="flex-1 flex flex-col items-center px-4">
            <span className="text-slate-400 text-xs mb-1">✈️</span>
            <div className="w-full border-t-2 border-dashed border-slate-200"></div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800 uppercase">{vuelo.destino}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Destino</p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Salida</p>
            <p className="text-sm text-slate-700 font-semibold">
                {new Date(vuelo.fecha_salida).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Aerolínea</p>
            <p className="text-sm text-slate-700 font-semibold">{vuelo.aerolineas?.nombre || "SkyFlow"}</p>
          </div>
        </div>

        {/* BARRA DE PLAZAS (Visible para todos) */}
        <div className="flex justify-between items-center px-1 mb-2">
          <p className="text-[11px] text-slate-500 font-bold uppercase">Disponibilidad</p>
          <p className={`text-sm font-mono font-bold ${vuelo.plazas_disponibles > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {vuelo.plazas_disponibles} <span className="text-slate-300 font-normal">/ {vuelo.plazas_totales}</span>
          </p>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${vuelo.plazas_disponibles > 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* FOOTER: PRECIO Y ACCIÓN CLIENTE */}
      <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
        <div>
          <p className="text-xs text-slate-500">Precio</p>
          <p className="text-2xl font-black text-blue-600">{vuelo.precio}€</p>
        </div>

        {/* Solo el Cliente o Anónimo ven el botón de reservar */}
        {esCliente && onReservar && (
          <button 
            onClick={() => onReservar(vuelo.id)}
            disabled={vuelo.plazas_disponibles <= 0}
            className={`font-bold py-2 px-6 rounded-md shadow-sm transition-all ${
              vuelo.plazas_disponibles > 0 
              ? 'bg-slate-800 text-white hover:bg-slate-900' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {vuelo.plazas_disponibles > 0 ? 'Reservar' : 'Completo'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VueloCard;