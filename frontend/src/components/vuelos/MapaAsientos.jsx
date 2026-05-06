import React from 'react';
import { Armchair, Plane } from 'lucide-react';

const MapaAsientos = ({ ocupados, alSeleccionar, seleccionado }) => {
  const filas = 10; 
  const columnas = ['A', 'B', ' ', 'C', 'D']; 

  return (
    <div className="bg-slate-900 dark:bg-slate-950 py-6 px-6 rounded-[2.5rem] border-t-4 border-slate-700 dark:border-slate-800 shadow-2xl w-full max-w-[240px] mx-auto my-2 shrink-0 transition-colors duration-500">
      
      {/* Cabina: Centrada sobre el pasillo */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-10 h-10 bg-slate-800 dark:bg-slate-900 rounded-full border-2 border-slate-700 dark:border-slate-800 flex items-center justify-center shadow-lg">
          <Plane className="text-slate-500 dark:text-slate-400" size={18} />
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] mt-2 italic">Cabina</p>
      </div>

      {/* Grid de Asientos */}
      <div className="grid grid-cols-[repeat(5,auto)] gap-x-3 gap-y-3 justify-center items-center">
        {Array.from({ length: filas }).map((_, i) => {
          const numFila = i + 1;
          return columnas.map((col, idx) => {
            
            // Pasillo central
            if (col === ' ') return (
              <div key={`gap-${numFila}-${idx}`} className="w-3 h-full flex justify-center">
                <div className="w-[1px] h-full bg-slate-800/40 dark:bg-slate-800/60" />
              </div>
            ); 

            const idAsiento = `${col}${numFila}`;
            const estaOcupado = ocupados.includes(idAsiento);
            const estaSeleccionado = seleccionado === idAsiento;

            return (
              <button
                key={idAsiento}
                disabled={estaOcupado}
                type="button"
                onClick={() => alSeleccionar(idAsiento)}
                className={`
                  relative p-1 rounded-lg transition-all duration-200
                  ${estaOcupado ? 'text-slate-800 dark:text-slate-800/50 cursor-not-allowed' : 
                    estaSeleccionado ? 'text-green-400 bg-green-400/20 scale-110 z-10 shadow-[0_0_15px_rgba(74,222,128,0.1)]' : 
                    'text-blue-500 dark:text-blue-400 hover:bg-blue-500/10'}
                `}
              >
                <Armchair 
                  size={20} 
                  fill={estaSeleccionado ? 'currentColor' : 'none'} 
                />
                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[6px] font-bold
                  ${estaSeleccionado ? 'text-green-400' : 'text-slate-600 dark:text-slate-500'}
                `}>
                  {idAsiento}
                </span>
              </button>
            );
          });
        })}
      </div>

      {/* Leyenda compacta */}
      <div className="mt-6 pt-4 border-t border-slate-800 dark:border-slate-800 flex justify-between text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-slate-800 dark:bg-slate-800 rounded-full"/> Ocupado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)]"/> Tu sitio
        </div>
      </div>
    </div>
  );
};

export default MapaAsientos;