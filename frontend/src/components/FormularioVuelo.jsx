import { useState, useEffect } from 'react';
import api from '../api/api';
import toast from 'react-hot-toast'; // Importamos la librería

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

    // --- 🛡️ VALIDACIONES CON TOAST ---
    
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

    // Usamos toast.promise para una experiencia de usuario top
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Origen</label>
        <input type="text" value={nuevoVuelo.origen} onChange={(e) => setNuevoVuelo({...nuevoVuelo, origen: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Destino</label>
        <input type="text" value={nuevoVuelo.destino} onChange={(e) => setNuevoVuelo({...nuevoVuelo, destino: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Aerolínea</label>
        <select 
          value={nuevoVuelo.aerolinea_id} 
          onChange={(e) => setNuevoVuelo({...nuevoVuelo, aerolinea_id: e.target.value})}
          className="w-full border rounded-md p-2 mt-1 bg-white"
        >
          {aerolineas.map(a => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>
      
      <div className="lg:col-span-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">Fecha</label>
        <input type="datetime-local" value={nuevoVuelo.fecha_salida} min={fechaMinima} onChange={(e) => setNuevoVuelo({...nuevoVuelo, fecha_salida: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>
      
      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase">Precio (€)</label>
        <input type="number" min="1" step="0.01" value={nuevoVuelo.precio} onChange={(e) => setNuevoVuelo({...nuevoVuelo, precio: e.target.value})} className="w-full border rounded-md p-2 mt-1" required />
      </div>

      <div className="lg:col-span-1">
        <label className="block text-xs font-bold text-gray-500 uppercase" title="Totales / Disponibles">Plazas</label>
        <div className="flex gap-1 mt-1">
          <input type="number" min="1" placeholder="Tot" title="Plazas Totales" value={nuevoVuelo.plazas_totales} onChange={(e) => setNuevoVuelo({...nuevoVuelo, plazas_totales: e.target.value})} className="w-1/2 border rounded-md p-2 text-xs" required />
          <input type="number" min="0" placeholder="Disp" title="Plazas Disponibles" value={nuevoVuelo.plazas_disponibles} onChange={(e) => setNuevoVuelo({...nuevoVuelo, plazas_disponibles: e.target.value})} className="w-1/2 border rounded-md p-2 text-xs" required />
        </div>
      </div>

      <div className="lg:col-span-1">
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-2 rounded-md hover:bg-blue-700 transition-all shadow-sm h-[42px] text-sm">
          Registrar
        </button>
      </div>
    </form>
  );
};

export default FormularioVuelo;