import React from 'react';
import { Plane, Calendar, Clock, User, Trash2, MapPin, Heart, UserPlus } from 'lucide-react';

import logoIberia from '../../assets/logos/iberia.png';
import logoRyanair from '../../assets/logos/ryanair.png';
import logoQatar from '../../assets/logos/qatar.png';
import logoAmerican from '../../assets/logos/americanairlines.png';
import logoWizzair from '../../assets/logos/wizzair.png';

const LOGOS_AEROLINEAS = {
  'iberia': logoIberia,
  'ryanair': logoRyanair,
  'qatar airways': logoQatar,
  'american airlines': logoAmerican,
  'wizzair': logoWizzair
};

const VueloCard = ({ vuelo, perfil, onReservar, onEliminar, isFavorito, onToggleFavorito, onAsignar }) => {
  const nombreRaw = vuelo.aerolineas?.nombre || "SkyFlow";
  const nombreKey = nombreRaw.toLowerCase().trim();
  const logoUrl = LOGOS_AEROLINEAS[nombreKey] ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreRaw)}&background=0284c7&color=fff&bold=true&font-size=0.33`;

  const obtenerHora = () => {
    if (!vuelo.fecha_salida) return "00:00";
    try {
      const fecha = new Date(vuelo.fecha_salida);
      return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return "00:00"; }
  };

  const horaFormateada = obtenerHora();

  // Control de vuelos caducados
  const fechaVuelo = new Date(vuelo.fecha_salida);
  const fechaActual = new Date();

  // Verifica si la fecha de salida es anterior a la fecha actual
  const esPasado = vuelo.fecha_salida ? fechaVuelo < fechaActual : false;
  const sinPlazas = vuelo.plazas_disponibles === 0;

  // Bloqueamos el botón si ya pasó o si no quedan asientos
  const botonBloqueado = esPasado || sinPlazas;

  // Texto dinámico para el botón del cliente
  let textoBoton = 'RESERVAR ASIENTO';
  if (esPasado) textoBoton = 'VUELO FINALIZADO';
  else if (sinPlazas) textoBoton = 'VUELO COMPLETO';

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-500 overflow-hidden group ${esPasado ? 'opacity-75 grayscale-[30%]' : 'hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-500/30'}`}>

      {/* HEADER: LOGO Y PRECIO */}
      <div className="p-5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
        <div className="h-10 w-32 flex items-center">
          <img
            src={logoUrl}
            alt={nombreRaw}
            className="max-h-full max-w-full object-contain transition-all duration-500 group-hover:scale-110 dark:brightness-125"
          />
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-3">
            {perfil && perfil.rol !== 'admin' && onToggleFavorito && !esPasado && (
              <button
                onClick={() => onToggleFavorito(vuelo.id)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
              >
                <Heart
                  size={22}
                  className={`transition-colors duration-300 ${isFavorito ? 'fill-red-500 text-red-500' : 'text-slate-300 dark:text-slate-600 hover:text-red-400'}`}
                />
              </button>
            )}
            <span className="block text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{vuelo.precio}€</span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mt-1">PRECIO FINAL</span>
        </div>
      </div>

      <div className="p-6">
        {/* TRAYECTO VISUAL */}
        <div className="flex justify-between items-center mb-8 relative">
          <div className="z-10 bg-white dark:bg-slate-900 pr-2 transition-colors">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">{vuelo.origen}</h3>
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 mt-1">
              <MapPin size={10} />
              <span className="text-[10px] font-bold uppercase">ORIGEN</span>
            </div>
          </div>

          <div className="flex-1 flex items-center relative group/plane mx-2">
            <div className="h-0.5 w-full border-t-2 border-dashed border-slate-200 dark:border-slate-700 relative">
              <div className={`absolute -top-2.75 left-0 w-full transition-all duration-1000 ${esPasado ? 'translate-x-[85%]' : 'group-hover/plane:translate-x-[85%]'}`}>
                <Plane className={`rotate-90 ${esPasado ? 'text-slate-400 dark:text-slate-600 fill-slate-400 dark:fill-slate-600' : 'text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]'}`} size={20} />
              </div>
            </div>
          </div>

          <div className="z-10 bg-white dark:bg-slate-900 pl-2 text-right transition-colors">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">{vuelo.destino}</h3>
            <div className="flex items-center justify-end gap-1 text-slate-400 dark:text-slate-500 mt-1">
              <span className="text-[10px] font-bold uppercase">DESTINO</span>
              <MapPin size={10} />
            </div>
          </div>
        </div>

        {/* DETALLES GRID */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50/80 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className={`flex items-center gap-2 text-xs font-bold ${esPasado ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
            <Calendar size={14} className={esPasado ? 'text-slate-400 dark:text-slate-500' : 'text-blue-500 dark:text-blue-400'} />
            {vuelo.fecha_salida ? new Date(vuelo.fecha_salida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : "---"}
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold ${esPasado ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
            <Clock size={14} className={esPasado ? 'text-slate-400 dark:text-slate-500' : 'text-blue-500 dark:text-blue-400'} />
            {horaFormateada}
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold ${esPasado ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
            <User size={14} className={esPasado ? 'text-slate-400 dark:text-slate-500' : 'text-blue-500 dark:text-blue-400'} />
            <span className={sinPlazas && !esPasado ? 'text-red-500' : ''}>{vuelo.plazas_disponibles} plazas</span>
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold uppercase ${esPasado ? 'text-slate-400 dark:text-slate-500' : 'text-blue-600 dark:text-blue-400'}`}>
            <Plane size={14} />
            DIRECTO
          </div>
        </div>

        {/* BOTONES */}
        <div className="space-y-2">
          {perfil?.rol === 'admin' ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAsignar?.(vuelo)}
                disabled={esPasado}
                className={`flex-1 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 ${esPasado
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                  }`}
              >
                <UserPlus size={16} /> Tripulación
              </button>
              <button
                onClick={() => onEliminar(vuelo.id)}
                className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onReservar(vuelo.id)}
              disabled={botonBloqueado}
              className={`w-full font-black py-4 rounded-2xl transition-all duration-300 shadow-lg tracking-tight ${botonBloqueado
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:shadow-blue-900/20 shadow-blue-200 active:scale-95 text-lg'
                }`}
            >
              {textoBoton}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VueloCard;