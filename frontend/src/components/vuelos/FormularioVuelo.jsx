import { useState, useEffect } from 'react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const FormularioVuelo = ({ onVueloCreado }) => {
  const [aerolineas, setAerolineas] = useState([]);
  const [nuevoVuelo, setNuevoVuelo] = useState({
    origen: '', 
    destino: '', 
    precio: '', 
    fecha_salida: '',
    plazas_totales: 150,
    plazas_disponibles: 150,
    aerolinea_id: '' 
  });

  const fechaMinima = new Date().toISOString().slice(0, 16);

  useEffect(() => {
    api.get('/aerolineas')
      .then(res => {
        setAerolineas(res.data);
        if (res.data.length > 0) {
          setNuevoVuelo(prev => ({ ...prev, aerolinea_id: res.data[0].id }));
        }
      })
      .catch(err => console.error("Error al cargar aerolíneas:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const precioFinal = parseFloat(nuevoVuelo.precio);
    const totalesFinal = parseInt(nuevoVuelo.plazas_totales);
    const disponiblesFinal = parseInt(nuevoVuelo.plazas_disponibles);

    if (precioFinal < 1) {
      toast.error("El precio debe ser al menos de 1€");
      return;
    }

    if (disponiblesFinal > totalesFinal) {
      toast.error(`Las plazas disponibles (${disponiblesFinal}) no pueden superar a las totales (${totalesFinal})`);
      return;
    }

    const datosParaEnviar = {
      ...nuevoVuelo,
      precio: precioFinal,
      plazas_totales: totalesFinal,
      plazas_disponibles: disponiblesFinal
    };

    const promesa = api.post('/vuelos/', datosParaEnviar);

    toast.promise(promesa, {
      loading: 'Registrando vuelo en el sistema...',
      success: () => {
        setNuevoVuelo({ 
          ...nuevoVuelo, 
          origen: '', 
          destino: '', 
          precio: '', 
          fecha_salida: '',
          plazas_totales: 150,
          plazas_disponibles: 150
        });
        if (onVueloCreado) onVueloCreado();
        return '¡Vuelo registrado con éxito! 🛫';
      },
      error: (err) => `Error: ${err.response?.data?.detail || "No se pudo registrar el vuelo"}`
    });
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 mb-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end transition-colors duration-500"
    >
      <div className="lg:col-span-1 space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Origen</label>
        <input type="text" value={nuevoVuelo.origen} onChange={(e) => setNuevoVuelo({...nuevoVuelo, origen: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" required placeholder="MAD" />
      </div>
      
      <div className="lg:col-span-1 space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Destino</label>
        <input type="text" value={nuevoVuelo.destino} onChange={(e) => setNuevoVuelo({...nuevoVuelo, destino: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" required placeholder="EZE" />
      </div>
      
      <div className="lg:col-span-1 space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Aerolínea</label>
        <select 
          value={nuevoVuelo.aerolinea_id} 
          onChange={(e) => setNuevoVuelo({...nuevoVuelo, aerolinea_id: e.target.value})}
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
        >
          {aerolineas.map(a => (
            <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.nombre}</option>
          ))}
        </select>
      </div>
      
      <div className="lg:col-span-2 space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Fecha</label>
        <input type="datetime-local" value={nuevoVuelo.fecha_salida} min={fechaMinima} onChange={(e) => setNuevoVuelo({...nuevoVuelo, fecha_salida: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
      </div>
      
      <div className="lg:col-span-1 space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Precio (€)</label>
        <input type="number" min="1" step="0.01" value={nuevoVuelo.precio} onChange={(e) => setNuevoVuelo({...nuevoVuelo, precio: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
      </div>

      <div className="lg:col-span-1 space-y-1">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Plazas (Tot/Disp)</label>
        <div className="flex gap-2">
          <input type="number" min="1" value={nuevoVuelo.plazas_totales} onChange={(e) => setNuevoVuelo({...nuevoVuelo, plazas_totales: e.target.value})} className="w-1/2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-slate-800 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
          <input type="number" min="0" value={nuevoVuelo.plazas_disponibles} onChange={(e) => setNuevoVuelo({...nuevoVuelo, plazas_disponibles: e.target.value})} className="w-1/2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-slate-800 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
        </div>
      </div>

      <div className="lg:col-span-1">
        <button type="submit" className="w-full bg-blue-600 text-white font-black py-3 px-2 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none h-[48px] text-xs uppercase tracking-widest active:scale-95">
          Registrar
        </button>
      </div>
    </form>
  );
};

export default FormularioVuelo;