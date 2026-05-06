import { useState } from 'react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const FormularioAerolinea = ({ onAerolineaCreada }) => {
  const [nuevaAerolinea, setNuevaAerolinea] = useState({
    nombre: '',
    codigo_iata: '',
    pais: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const promesa = api.post('/aerolineas/', nuevaAerolinea);

    toast.promise(promesa, {
      loading: 'Registrando aerolínea...',
      success: () => {
        setNuevaAerolinea({ nombre: '', codigo_iata: '', pais: '' });
        if (onAerolineaCreada) onAerolineaCreada();
        return '¡Aerolínea registrada con éxito! 🏢';
      },
      error: (err) => `Error: ${err.response?.data?.detail || "No se pudo registrar"}`
    });
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end transition-colors duration-500"
    >
      <div className="space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Nombre</label>
        <input 
          type="text" 
          value={nuevaAerolinea.nombre} 
          onChange={(e) => setNuevaAerolinea({...nuevaAerolinea, nombre: e.target.value})} 
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
          required 
          placeholder="Ej. Iberia" 
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Código IATA</label>
        <input 
          type="text" 
          value={nuevaAerolinea.codigo_iata} 
          onChange={(e) => setNuevaAerolinea({...nuevaAerolinea, codigo_iata: e.target.value})} 
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
          required 
          maxLength="3" 
          placeholder="Ej. IBE" 
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">País</label>
        <input 
          type="text" 
          value={nuevaAerolinea.pais} 
          onChange={(e) => setNuevaAerolinea({...nuevaAerolinea, pais: e.target.value})} 
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
          required 
          placeholder="Ej. España" 
        />
      </div>

      <button 
        type="submit" 
        className="bg-blue-600 text-white font-black py-3 px-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 h-[48px] uppercase text-xs tracking-widest"
      >
        Añadir Aerolínea
      </button>
    </form>
  );
};

export default FormularioAerolinea;